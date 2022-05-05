

module.exports.consumer = async (event) => {
  const random = Math.random();

    var messageCount=0;
    if (event.Records) {
        messageCount += event.Records.length
    }

    if (random > 0.5) {
      const err = new Error('Im an error!')
      throw err
  }

    console.log('Message Count: ', messageCount)
    console.log(JSON.stringify(event))
};


