const Backoff = (retries) => {
    // let jitter = Math.floor((Math.random() * 60) + 1);
    // let backoff = Math.min(30, Math.pow(2, retries) * 10) + jitter;
    let temp = Math.min(130, Math.pow(2, retries) * 30);
    let sleep = temp / 2 + Math.random() * (temp * 3);
    let backoff = Math.floor(sleep);
    return backoff;
  }

module.exports=Backoff;