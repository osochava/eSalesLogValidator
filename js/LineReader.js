let EventEmitter = require('events').EventEmitter;

class LineReader {
  constructor(options) {
    this._reader = new FileReaderSync();
    this._eventEmitter = new EventEmitter();
    this._onLoadNewLinesEvent = "lines";
    this._progressEvent = "progress";
    this._finishedEvent = "finished";
    this._errorEvent = "error";
    this._progress = 0;
    /**
     * If 'chunkSize' has been set by the user, use that value, otherwise,
     * default to 1024
     */
    this._chunkSize = (options && options.chunkSize) ? options.chunkSize : 1024;
    this._isAborted = false;
    this._onload = (result) => {
      this._chunk += result;
      /**
       * If the processed text contains a newline character
       */
      if (/\r|\n/.test(this._chunk)) {
        /**
         * Split the text into an array of lines
         */
        this._lines = this._chunk.split(/\r\n|\r|\n/);
        if (this._lines[this._lines.length - 1] === "")
          this._lines.pop();

        /**
         * If there is still more data to read, save the last line, as it may be
         * incomplete
         */
        if (this._hasMoreData()) {
          /**
           * If the loaded chunk ends with a newline character then the last line
           * is complete and we don't need to store it
           */
          this._chunk = this._chunk[this._chunk.length - 1] === '\n' ? '' : this._lines.pop();
        }

        /**
         * Start stepping through each line
         */
        this._step();

        /**
         * If the text did not contain a newline character
         */
      } else {

        /**
         * Start another round of the read process if there is still data to read
         */
        if (this._hasMoreData()) {
          this.read();
          return;
        }

        /**
         * If there is no data left to read, but there is still data stored in
         * 'chunk', emit it as a line
         */
        if (this._chunk.length) {
          this._emitOnLoadNewLines([
            this._chunk,
            this._emitFinished.bind(this)
          ]);
          return;
        }

        /**
         * if there is no data stored in 'chunk', emit the end event
         */
        this._emitFinished();
      }
    }

    this._errorHandler = (error) => {
      this._emitErrors(`An error occurred reading the file: ${error.message}`);
    }
  }

  subscribeToOnLoadNewLines(newLineHandler) {
    this._eventEmitter.on(this._onLoadNewLineEvent, newLineHandler);
  }

  _emitOnLoadNewLines(args) {
    this._eventEmitter.emit(this._onLoadNewLineEvent, args);
    this._updateProgress();
  }

  subscribeToProgressChanges(updateProgressHandler) {
    this._eventEmitter.on(this._progressEvent, updateProgressHandler);
  }

  _emitProgressChanges(args) {
    this._eventEmitter.emit(this._progressEvent, args);
  }

  subscribeToFinishedEvent(finishedEventHandler) {
    this._eventEmitter.on(this._finishedEvent, finishedEventHandler);
  }

  _emitFinished(args) {
    this._progress = 100;
    this._emitProgressChanges(this._progress);
    this._eventEmitter.emit(this._finishedEvent, args);
  }

  subscribeToErrors(errorHandler) {
    this._eventEmitter.on(this._errorEvent, errorHandler);
  }

  _emitErrors(args) {
    this._eventEmitter.emit(this._errorEvent, args);
  }

  read(file) {
    if (arguments.length != 0) { // initialize only if the function was launched from outside
      this.file = file;
      this.fileLength = file.size;
      this.readPos = 0;
      this._chunk = '';
      this._lines = [];
      this._updateProgress();
    }
    var blob = this.file.slice(this.readPos, this.readPos + this._chunkSize);
    this.readPos += this._chunkSize;
    try {
      this._onload(this._reader.readAsText(blob));
    } catch (er) {
      this._errorHandler(er);
    }
  }

  abort() {
    this._isAborted = true;
  }

  /**
   * LineReader#_step
   *
   * Internal: gets the next line and emits it as a `line` event
   */
  _step() {
    /**
     * If there are no lines left to emit and there is still data left to read,
     * start the read process again, otherwise, emit the 'end' event
     */
    if (this._lines.length === 0) {
      if (this._hasMoreData()) {
        this.read();
        return;
      }
      this._emitFinished();
      return;
    }

    if (!this._isAborted) {
      this._emitOnLoadNewLines([
        this._lines,
        this._step.bind(this)
      ]);
      this._lines = [];
    } else {
      this._emitFinished();
    }
  }

  _hasMoreData() {
    return this.readPos <= this.fileLength;
  }

  _updateProgress() {
    let oldValue = this._progress;
    this._progress = Math.floor((this.readPos / this.fileLength) * 100);
    if (this._progress != oldValue)
      this._emitProgressChanges(this._progress);
  }

}

module.exports = LineReader;