const logCorruptedError = "Log is corrupted";
const concurrentError = "Concurrent sessions for the same customer";
const notFinishedError = "Session is not finished ";
const wrongActionOrderError = "Wrong actions order";

class Session {
  constructor(firstAction) {
    this._dateFormat = require('dateformat');
    this._startDate = firstAction.date;
    this._isStartDateValid = firstAction.isDateValid;
    this._endDate = undefined;
    this._duration = undefined;
    this._session_key = firstAction.session_key;
    this._customer_key = firstAction.customer_key;
    this._market = firstAction.market;
    this._actions = [];
    this._isFinished = false;
    this._errors = [];
    this.cart = [];
    this.clicks = [];
    this.nonClicks = [];
    this.boughtProducts = [];
    this._viewedActCount = 0;
    this._boughtActCount = 0;
    this._ratedActCount = 0;
    this._validateFields();
  }
  _validateFields() {
    if (this.session_key === undefined || this.customer_key === undefined || this.market === undefined)
      this._errors.push(new Error(logCorruptedError));
  }
  addConcurentError() {
    this._errors.push(new Error(concurrentError));
  }
  get customer_key() {
    return this._customer_key;
  }
  get session_key() {
    return this._session_key;
  }
  get market() {
    return this._market;
  }
  get startDate() {
    return this._isStartDateValid ? this._dateFormat(this._startDate, "yyyy-mm-dd HH:mm") : this._startDate;
  }
  get totalActions() {
    return this._actions.length;
  }
  get viewedActCount() {
    return this._viewedActCount;
  }
  get boughtActCount() {
    return this._boughtActCount;
  }
  get ratedActCount() {
    return this._ratedActCount;
  }
  get hasError() {
    return this._errors.length > 0;
  }
  get error() {
    return this._errors.length > 0 ? this._errors[0].message : "";
  }
  get isFinished() {
    return this._isFinished;
  }
  _removeProductIfExists(array, product) {
    let hasProduct = false;
    for (var i = 0; i < array.length; i++) {
      if (product.equals(array[i])) {
        array.splice(i, 1);
        hasProduct = true;
        break;
      }
    }
    return hasProduct;
  }
  _checkTimestampIfNeeded(date) {
    if (!this._isFinished)
      return;
    if (this._endDate.getTime() != date.getTime()) {
      this._errors.push(new Error(logCorruptedError));
    }
  }
  addToCart(product, date) {
    this._checkTimestampIfNeeded(date);
    this._viewedActCount++;
    let hasClickedProduct = this._removeProductIfExists(this.clicks, product);
    if (hasClickedProduct) {
      this.cart.push(product);
    } else {
      errors.push(new Error(wrongActionOrderError));
    }
  }
  nonAddtoCart(product, date) {
    this._checkTimestampIfNeeded(date);
    this._viewedActCount++;
    let hasClickedProduct = this._removeProductIfExists(this.nonClicks, product);
    if (hasClickedProduct) {
      this.cart.push(product);
    } else {
      errors.push(new Error(wrongActionOrderError));
    }
  }
  addToClicks(product, date) {
    this._checkTimestampIfNeeded(date);
    this._viewedActCount++;
    this.clicks.push(product);
  }
  addToNonClicks(product, date) {
    this._checkTimestampIfNeeded(date);
    this._viewedActCount++;
    this.nonClicks.push(product);
  }
  payment(products, date) {
    this._checkTimestampIfNeeded(date);
    this._boughtActCount++;
    for (let i = 0; i < products.length; i++) {
      if (!this._removeProductIfExists(this.cart, products[i])) {
        this._errors.push(new Error(wrongActionOrderError));
      } else {
        this.boughtProducts.push(products[i]);
      }
    }
  }
  rate(product, date) {
    this._checkTimestampIfNeeded(date);
    this._ratedActCount++;
    let boughtProduct = false
    for (var i = 0; i < this.boughtProducts.length; i++) {
      if (this.boughtProducts[i].product_key === product.product_key) {
        // (this.boughtProducts[i].equals(product) 
        boughtProduct = true;
        break;
      }
    }
    if (!boughtProduct) this._errors.push(new Error(wrongActionOrderError));
  }
  finishedSession(date) {
    if (!this._isFinished) {
      this._isFinished = true;
      this._endDate = date;
      this._duration = this._isStartDateValid ? (date - this._startDate) / 1000 : "invalid start date";
    } else {
      throw new Error("session was finished yet");
    }
  }
  checkIsFinished() {
    if (!this._isFinished) {
      this._errors.push(new Error(notFinishedError));
    }
  }
  addAndExecAction(action) {
    this._customer_key = (this._customer_key === "") ? action.session_key : this._customer_key;
    this._market = (this._market === "") ? action.market : this._market;
    if (action.session_key != "" && action.session_key != this.session_key)
      throw new Error("The field session_key in action and session must be equals");
    if (action.customer_key != this._customer_key)
      this._errors.push(new Error(logCorruptedError));
    if (action.market != this.market)
      this._errors.push(new Error(logCorruptedError));
    this._actions.push(action);
    try {
      action.completionOfReadingLogs(); // throw error if log is corrupted
    } catch (e) {
      this._errors.push(e);
    }
    this._execAction(action);
  }

  _execAction(action) {
    if (this._errors.length != 0)
      return;
    try {
      action.exec(this);
    } catch (e) {
      this._errors.push(e);
    }
  }
  get duration() {
    if (this._duration === undefined) return "-";
    let hours = Math.floor(this._duration / (60 * 60));
    let min = Math.floor((this._duration % (60 * 60)) / 60);
    let sec = (this._duration % (60 * 60)) % 60;
    let strDuration = hours + ":" + min + ":" + ((Math.floor(sec / 10) > 0) ? "" : "0") + sec;
    return strDuration;
  }
  get actionsLogs() {
    let logs = [];
    this._actions.forEach(function(action, index) {
      let aLogs = action.logs;
      let aProducts = action.products;
      logs.push({ aLogs, aProducts });
    });
    return logs;
  }
  toString() {
    let str = "";
    str += "startDate : " + this.startDate + "\n";
    str += "isFinished : " + this._isFinished + "\n";
    str += "_duration : " + this._duration + "\n";
    str += "duration : " + this.duration + "\n";
    str += "session_key : " + this.session_key + "\n";
    str += "_customer_key : " + this._customer_key + "\n";
    str += "market : " + this.market + "\n";
    str += "viewedActCount : " + this.viewedActCount + "\n";
    str += "boughtActCount : " + this.boughtActCount + "\n";
    str += "ratedActCount : " + this.ratedActCount + "\n";
    str += "actions : " + this._actions.length + "\n";
    str += "errors :" + this._errors.length + ", " + this._errors;
    return str;
  }
}

module.exports = { Session };