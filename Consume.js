const AWS = require("aws-sdk");
const uuid = require('uuid');
const sqs = new AWS.SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;
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

    const receipt = dlqlist[i].receiptHandle;

    const params = {
      TableName: process.env.DYNAMODB_DLQ_TABLE,
      Item: {
        id: uuid.v1(),
        Value: dlqlist[i].body,
        updatedAt: new Date().getTime()
      }
    };
    console.log(params);
    // save in database
    await dynamoDb.put(params).promise();
    const deleteparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
    }
    // deleting message from sqs
    await sqs.deleteMessage(deleteparams).promise();
  }

  // no error criteria
  if (random <= 0.5 || visibilitylist.length == 0) {
    return;
  }

  for (let i = 0; i < visibilitylist.length; i++) {
    const retries = visibilitylist[i].attributes.ApproximateReceiveCount;
    const receipt = visibilitylist[i].receiptHandle;

    const Visibilityparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
      VisibilityTimeout: parseInt(Backoff(retries))
    };
    console.log(Visibilityparams)
    // changing message visibility
    const chk = await sqs.changeMessageVisibility(Visibilityparams).promise();
    console.log(JSON.stringify(chk));
  }
  // emiting error
  throw new Error(`Message Recieve Failed`)

}


const Backoff = (retries) => {
  // let jitter = Math.floor((Math.random() * 60) + 1);
  // let backoff = Math.min(30, Math.pow(2, retries) * 10) + jitter;
  let temp = Math.min(30, Math.pow(2, retries) * 5);
  let sleep = temp / 2 + Math.random() * (temp / 2);
  let backoff = Math.floor(30 + sleep);
  return backoff;
}