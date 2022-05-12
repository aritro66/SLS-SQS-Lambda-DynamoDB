const Backoff = (retries) => {
  // let jitter = Math.floor((Math.random() * 60) + 1);
  // let backoff = Math.min(30, Math.pow(2, retries) * 10) + jitter;
  let temp = Math.pow(2, retries) * 15;
  let sleep = temp / 2 + Math.random() * (240);
  let backoff = Math.floor(sleep);
  return backoff;
}

module.exports = Backoff;
