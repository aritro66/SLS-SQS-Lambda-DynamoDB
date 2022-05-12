const AWS = require("aws-sdk");
const uuid = require('uuid');
const Backoff = require('./Backoff.js');
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
  const dlqlist = event.Records.filter(ele => ele.messageAttributes.reAtempts.stringValue > 3);
  const visibilitylist = event.Records.filter(ele => ele.messageAttributes.reAtempts.stringValue <= 3);
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
  if (random <= 0.8 || visibilitylist.length == 0) {
    return;
  }

  for (let i = 0; i < visibilitylist.length; i++) {
    const retries = visibilitylist[i].messageAttributes.reAtempts.stringValue;
    const receipt = visibilitylist[i].receiptHandle;

    const sendparams = {
      DelaySeconds: Backoff(retries),
      QueueUrl: QUEUE_URL,
      MessageBody: visibilitylist[i].body,
      MessageAttributes: {
        reAtempts: {
          DataType: "String",
          StringValue: (1 + parseInt(retries)).toString()
        }
      }
    }

    const chk1 = await sqs.sendMessage(sendparams).promise();
    const deleteparams2 = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
    }

    // deleting message from sqs
    const chk2 = await sqs.deleteMessage(deleteparams2).promise();
    console.log("chk1", JSON.stringify(chk1));
    console.log("chk2", JSON.stringify(chk2));
    // const Visibilityparams = {
    //   QueueUrl: QUEUE_URL,
    //   ReceiptHandle: receipt,
    //   VisibilityTimeout: parseInt(Backoff(retries))
    // };
    // console.log(Visibilityparams)
    // // changing message visibility
    // const chk = await sqs.changeMessageVisibility(Visibilityparams).promise();
    // console.log(JSON.stringify(chk));
  }
  // emiting error
  throw new Error(`Message Recieve Failed`)

}


