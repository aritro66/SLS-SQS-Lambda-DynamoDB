const { SQS } = require("aws-sdk");

const sqs = new SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;


var messageCount = 0;
module.exports.consumer = async (event) => {


  const random = Math.random();

  if (event.Records) {
    messageCount += event.Records.length
  }  
  console.log('Message Count: ', messageCount)
  console.log(JSON.stringify(event))
  if (event.Records[0].attributes.ApproximateReceiveCount > 3) {
    throw new Error("more than 3 tries");
  }
  if (random > 0.5) {
    event.Records.forEach((ele) => {
      const retries = ele.attributes.ApproximateReceiveCount;
      const receipt = ele.receiptHandle;
      console.log(retries);
      
      console.log("w");
      const Visibilityparams = {
          QueueUrl: QUEUE_URL,
          ReceiptHandle: receipt,
          VisibilityTimeout: parseInt(Backoff(retries))
        };
        console.log(Visibilityparams)
        sqs.changeMessageVisibility(Visibilityparams)
    });


    throw new Error(`Im an error! ${event.Records[0].attributes.ApproximateReceiveCount}`)
    
  }

  

}


const Backoff = (retries) => {
  let jitter = Math.floor((Math.random() * 60) + 1);
  let backoff = Math.pow(2, retries) + 30 + jitter;

  return backoff;
}