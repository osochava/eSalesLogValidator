let LineReader = require('./lineReader.js');

module.exports = function(self) {
  self.addEventListener('message', function(e) {
    debugger;
    let file = e.data;
    let lr = new LineReader({ chunkSize: 1024 * 1024 });
    lr.subscribeToOnLoadNewLines((args) => {
      setTimeout(() => {
        try {
          self.postMessage(JSON.stringify({ lines: args[0] }));
        } catch (e) {
          console.error(e);
          self.postMessage({ error: e });
        }
        args[1]();
      }, 0); // Call next to resume

    });
    lr.subscribeToErrors((err) => {
      self.postMessage(JSON.stringify({ error: err }));
    });
    lr.subscribeToProgressChanges((progressValue) => {
      self.postMessage(JSON.stringify({ progress: progressValue }));
    });
    lr.subscribeToFinishedEvent((args) => {
      self.postMessage(JSON.stringify({ finish: true }));
    });
    lr.read(file);
  });
}