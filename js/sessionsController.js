let sessionClasses = require('./session.js');

class SessionsController {
  constructor() {
    this._sessions = [];
    this._invalidActions = [];
  }
  get sessions() {
    return this._sessions;
  }
  /**
   * gets session from list by session_id (gets it from action parameter)
   * include the validate of the concurrent sessions  (by customer_key)
   * @param {Action} action
   * @return {Session} session object
   * if session_id in action object is empty return undefined
   */
  getSession(action) {
    let sessionId = action.session_key;
    if (sessionId === undefined || sessionId === "") {
      this._invalidActions.push(action);
      return;
    }
    let session = this._sessions[sessionId];
    if (!session) {
      session = new sessionClasses.Session(action);
      //check current customer in other unfinished sessions
      Object.keys(this._sessions).forEach(function(key, index) {
        if (!this[key].isFinished && this[key].customer_key === session.customer_key) {
          session.addConcurentError(session);
        }
      }, this._sessions);
      this._sessions[sessionId] = session;

    }
    return session;
  }
  get totalNumberOfSessions() {
    return Object.keys(this._sessions).length;
  }
  get numberOfValidSessions() {
    var length = 0;
    Object.keys(this._sessions).forEach(function(key, index) {
      if (!this[key].hasError) {
        length++;
      }
    }, this._sessions);
    return length;
  }
  get numberOfInvalidSessions() {
    var length = 0;
    Object.keys(this._sessions).forEach(function(key, index) {
      if (this[key].hasError) {
        length++;
      }
    }, this._sessions);
    return length;
  }
  get numberOfActionsWithoutSessionId() {
    return this._invalidActions.length;
  }
  checkIsSessionsFinished() {
    Object.keys(this._sessions).forEach(function(key, index) {
      this[key].checkIsFinished();
    }, this._sessions);
  }
  clearSesionsArray() {
    this._sessions = [];
    this._invalidActions = [];
  }
  logSessionsState() {
    Object.keys(this._sessions).forEach(function(key, index) {
      console.log(this[key].toString());
    }, this._sessions);
  }
}

module.exports = { SessionsController };