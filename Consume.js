const { SQS } = require("aws-sdk");

const sqs = new SQS();
const QUEUE_URL = `https://sqs.us-east-1.amazonaws.com/${process.env.ACCOUNT_ID}/demo`;


var messageCount = 0;
module.exports.consumer = async (event) => {

  try {
    const random = Math.random();

    if (event.Records) {
      messageCount += event.Records.length
    }

    if (random > 0.5) {
      const err = new Error('Im an error!')
      throw err
    }

    console.log('Message Count: ', messageCount)
    console.log(JSON.stringify(event))
  } catch (err) {
    console.log("error occured");
    console.log(JSON.stringify(event));
    const retries = event.Records[0].attributes.ApproximateReceiveCount;
    const receipt = event.Records[0].receiptHandle;
    console.log(retries);
    if (retries <= 3) {
      console.log("visible");
      var Visibilityparams = {
        QueueUrl: QUEUE_URL,
        ReceiptHandle: receipt,
        VisibilityTimeout: parseInt(Backoff(retries))
      };
      sqs.changeMessageVisibility(Visibilityparams, function (err, data) {
        if (err) console.log(err, err.stack); 
        else console.log(data);           
      });
    }

  };

}


const Backoff = (retries) => {
  let jitter = Math.floor((Math.random() * 60) + 1);
  let backoff = Math.pow(2, retries) + 30 + jitter;

  return backoff;
}