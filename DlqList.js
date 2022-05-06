const AWS = require('aws-sdk');
const uuid = require('uuid');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.savedata = async (event) => {
    try{
      const { Records } = event;
      const body = Records[0].body;
      console.log("incoming message body from SQS: ",body);
      const params = {
        TableName: process.env.DYNAMODB_DLQ_TABLE,
        Item: {
          id: uuid.v1(),
          Value: body,
          updatedAt: new Date().getTime()  
        }
      };
      await dynamoDb.put(params).promise();
  
      console.log('Successfully written to DynamoDB');
    }
    catch(error){
      console.error('Error in executing lambda handler from SQS', error);
      return;
    }
  };