const AWS = require("aws-sdk");
const uuid = require('uuid');
const sqs = new AWS.SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;
// const QUEUE_URL2 = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demodlq`;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

var messageCount = 0;
module.exports.consumer = async (event) => {


  const random = Math.random(); // random no. for error generation

  if (event.Records) {
    messageCount += event.Records.length
  }
  console.log('Message Count: ', messageCount)

  // dlqlist messages whose recieve count is more than 3
  // visibility messages whose recieve count is less than equal 3
  const dlqlist = event.Records.filter(ele => ele.attributes.ApproximateReceiveCount > 3);
  const visibilitylist = event.Records.filter(ele => ele.attributes.ApproximateReceiveCount <= 3);
  console.log("dlq", JSON.stringify(dlqlist));
  console.log("visibility", JSON.stringify(visibilitylist));

  
  for (let i = 0; i < dlqlist.length; i++) {
    const retries = dlqlist[i].attributes.ApproximateReceiveCount;
    const receipt = dlqlist[i].receiptHandle;
    console.log(retries);

    console.log("wu");
    const params = {
      TableName: process.env.DYNAMODB_DLQ_TABLE,
      Item: {
        id: uuid.v1(),
        Value: dlqlist[i].body,
        updatedAt: new Date().getTime()
      }
    };
    console.log(params);
    await dynamoDb.put(params).promise(); // save in database
    const deleteparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
    }
    await sqs.deleteMessage(deleteparams).promise(); // deleting message from sqs
  }

  if (random <= 0.5 || visibilitylist.length == 0) {  // no error criteria
    return;
  }

  for (let i = 0; i < visibilitylist.length; i++) {
    const retries = visibilitylist[i].attributes.ApproximateReceiveCount;
    const receipt = visibilitylist[i].receiptHandle;
    console.log(retries);

    console.log("w");
    const Visibilityparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
      VisibilityTimeout: parseInt(Backoff(retries))
    };
    console.log(Visibilityparams)
    await sqs.changeMessageVisibility(Visibilityparams).promise();  // changing message visibility
  }

  throw new Error(`Im an error!`) // emiting error

}


const Backoff = (retries) => {
  let jitter = Math.floor((Math.random() * 60) + 1);
  let backoff = Math.pow(2, retries) + 30 + jitter;

  return backoff;
}