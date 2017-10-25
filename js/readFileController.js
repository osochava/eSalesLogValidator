let actionsClasses = require('./actionsClasses.js')
let sessionsController = require('./sessionsController.js')
let LineReader = require('./lineReader.js');
let EventEmitter = require('events').EventEmitter;
let work = require('webworkify');


class Controller {
  constructor() {
    this._sessionsCntrl = new sessionsController.SessionsController();
    this._actionsFactory = new actionsClasses.ActionsFactory();
    this._progressEvent = "progress";
    this._finishEvent = "finish";
    this._eventEmitter = new EventEmitter();
  }
  get sessionsModel() {
    return this._sessionsCntrl;
  }
  subscribeToProgressChanges(updateProgressHandler) {
    this._eventEmitter.on(this._progressEvent, updateProgressHandler);
  }
  _emitProgressChanges(args) {
    this._eventEmitter.emit(this._progressEvent, args);
  }
  subscribeToFinishEvent(finishHandler) {
    this._eventEmitter.on(this._finishEvent, finishHandler);
  }
  _emitFinishEvent(args) {
    this._eventEmitter.emit(this._finishEvent, args);
  }
  _initNewFile() {
    this._sessionsCntrl.clearSesionsArray();
    this._lastline = undefined;
    this._currentAction = undefined;
    this._i = -1;
    this._isReadingAction = false;
    this._currentDate;
  }
  _newLineCallback(lines) {
    try {
      lines.forEach(function(element, index) {
        this._readline(element);
      }, this);
    } catch (e) {
      console.error(e);
    }
  }
  _finishHandler() {
    if (this._currentAction != undefined) {
      let session = this._sessionsCntrl.getSession(this._currentAction);
      session.addAndExecAction(this._currentAction);
      this._currentAction = undefined;
    }
    this._sessionsCntrl.checkIsSessionsFinished();
    this._emitFinishEvent(this._sessionsCntrl);
  }
  readLogs(file) {
    this._initNewFile();
    var w = work(require('./worker.js'));
    let first = true;
    w.addEventListener('message', function(ev) {
      if (first) {
        // revoke the Object URL that was used to create this worker, so as
        // not to leak it
        URL.revokeObjectURL(w.objectURL);
        first = false;
      }
      let msg = JSON.parse(ev.data);
      let lines = msg.lines;
      let progressValue = msg.progress;
      let error = msg.error;
      let finish = msg.finish;
      if (lines != undefined) {
        setTimeout(() => { this._newLineCallback(lines); }, 0);
      }
      if (progressValue != undefined) {
        this._emitProgressChanges(progressValue);
      }
      if (error != undefined) {
        console.log(error);
      }
      if (finish != undefined) {
        setTimeout(() => { this._finishHandler(); }, 0);
      }
    }.bind(this));
    w.addEventListener('messageerror', function(ev) {
      console.log("Error in the worker occured: " + ev.data);
    });
    w.postMessage(file);
  }
  _isDataValid(d) {
    if (Object.prototype.toString.call(d) === "[object Date]") {
      if (isNaN(d.getTime())) {
        return false; //"invalid data format
      }
    } else {
      return false; //data line was expected
    }
    return true;
  }
  _readline(line) {
    if (line === "") {
      this._isReadingAction = false;
      return;
    }
    if (!this._isReadingAction) {
      let date = new Date(line);
      this._dateObj = {};
      this._dateObj.isValid = this._isDataValid(date);
      this._dateObj.date = this._dateObj.isValid ? date : line;
      if (this._currentAction != undefined) {
        let session = this._sessionsCntrl.getSession(this._currentAction);
        if (session != undefined)
          session.addAndExecAction(this._currentAction);
        this._currentAction = undefined;
      }
      this._isReadingAction = true; // start reading new action proccess
      this._i++;
      return;
    }
    if (this._currentAction === undefined) {
      let action = this._actionsFactory.createAction(this._dateObj, line);
      this._dateObj = undefined; // reset date value for the next action
      this._currentAction = action;
      return;
    }
    this._currentAction.addLog(line);
  }
}

module.exports = Controller;