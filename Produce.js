const { SQS } = require("aws-sdk");
const Backoff = require('./Backoff.js');

const sqs = new SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;

module.exports.producer = async (event) => {
  let statusCode = 200;
  let message;



  try {
    for (let i = 0; i < 10; i++) {
      await sqs.sendMessageBatch({ Entries: createBatchEntries(), QueueUrl: QUEUE_URL }).promise()
    }

    message = `Message accepted! ${new Date()}`;
  } catch (error) {
    console.log(error);
    message = error;
    statusCode = 500;
  }

  return {
    statusCode,
    body: JSON.stringify({
      message,
    }),
  };
};

const createBatchEntries = () => {
  let entries = []
  for (let i = 0; i < 10; i++) {
    entries.push({
      Id: parseInt(Math.random() * 100000).toString(),
      MessageBody: Math.random().toString(),
      DelaySeconds: Backoff(Math.floor(Math.random() * 3 + 1)),
      MessageAttributes: {
        reAtempts: {
          DataType: "String",
          StringValue: "1"
        }
      }
    })
  }
  return entries
}

