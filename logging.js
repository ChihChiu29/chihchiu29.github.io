// Convenience logging functions.

function log(message, /*depth in the stack trace*/depth = 2) {
  const e = new Error();
  const path = e.stack.split('\n')[depth].split('\\');
  // Example: "at C:\Workspace\git\gitlab_webcollection\tcartoon\batchjob.js:28:13"
  const filetag = path[path.length - 1].split(')')[0].split(':').slice(0, 2).join(':');
  if (typeof (message) === 'string') {
    console.log(`${new Date().toTimeString().slice(0, 8)} [${filetag}] ${message}`);
  } else {
    const jsonMsg = JSON.stringify(message);
    if (jsonMsg !== '{}') {
      console.log(`${new Date().toTimeString().slice(0, 8)} [${filetag}] ${jsonMsg}`);
    } else {
      console.log(`${new Date().toTimeString().slice(0, 8)} [${filetag}]: ${message}`);
    }
  }
}

function info(tag, message) {
  log(`[${tag}] ${message}`, 3);
}

module.exports = {
  log: log,
  info: info,
};
