const { SQS } = require("aws-sdk");

const sqs = new SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;
const QUEUE_URL2 = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demodlq`;


var messageCount = 0;
module.exports.consumer = async (event) => {


  const random = Math.random();

  if (event.Records) {
    messageCount += event.Records.length
  }
  console.log('Message Count: ', messageCount)
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
      QueueUrl: QUEUE_URL2,
      MessageBody: dlqlist[i].body
    };
    console.log(params);
    await sqs.sendMessage(params).promise();
    const deleteparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
    }
    await sqs.deleteMessage(deleteparams).promise();
  }

  if (random <= 0.5 || visibilitylist.length==0) {
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
    await sqs.changeMessageVisibility(Visibilityparams).promise();
  }

  throw new Error(`Im an error!`)

}


const Backoff = (retries) => {
  let jitter = Math.floor((Math.random() * 60) + 1);
  let backoff = Math.pow(2, retries) + 30 + jitter;

  return backoff;
}