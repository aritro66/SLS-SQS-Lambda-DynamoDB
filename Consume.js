const { SQS } = require("aws-sdk");

const sqs = new SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;


var messageCount = 0;
module.exports.consumer = async (event) => {


  const random = Math.random();

  if (event.Records) {
    messageCount += event.Records.length
  }
  
  if (retries > 3) {
    throw new Error("more than 3 tries");
  }
  if (random > 0.5) {
    const retries = event.Records[0].attributes.ApproximateReceiveCount;
    const receipt = event.Records[0].receiptHandle;
    const Visibilityparams = {
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receipt,
      VisibilityTimeout: parseInt(Backoff(retries))
    };
    console.log(Visibilityparams)
    sqs.changeMessageVisibility(Visibilityparams)


    throw new Error(`Im an error! ${retries}`)
    
  }

  console.log('Message Count: ', messageCount)
  console.log(JSON.stringify(event))

}


const Backoff = (retries) => {
  let jitter = Math.floor((Math.random() * 60) + 1);
  let backoff = Math.pow(2, retries) + 30 + jitter;

  return backoff;
}