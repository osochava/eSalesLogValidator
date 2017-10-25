const logCorruptedError = "Log is corrupted";
let productClass = require('./product.js');

class Action {
  constructor(dateObj, type) {
    this._isDateValid = dateObj.isValid
    this._dateFormat = require('dateformat');
    this._date = dateObj.date;
    this._type = type;
    this._logs = [];
    this._attrs = [];
  }

  get date() { return this._date; }
  get isDateValid() { return this._isDateValid; }
  get session_key() { return this._session_key; }
  get customer_key() { return this._customer_key; }
  get market() { return this._market; }
  get logs() {
    let log = "";
    log += this.isDateValid ? this._dateFormat(this._date, "yyyy-mm-dd HH:mm:ss") : this._date;
    log += " - ";
    log += this._type;
    return log;
  }
  addLog(log) {
    this._logs.push(log);
    return this._readAttribute(log);
  }
  _readAttribute(str) {
    let arr = str.split(" = ");
    if (arr.length != 2) {
      throw new Error("Invalid string format");
    }
    let isSuccess = false;
    switch (arr[0]) {
      case "session_key":
        {
          this._session_key = arr[1];
          isSuccess = true;
          break;
        }
      case "customer_key":
        {
          this._customer_key = arr[1];
          isSuccess = true;
          break;
        }
      case "market":
        {
          this._market = arr[1];
          isSuccess = true;
          break;
        }
      default:
        {
          this._attrs.push(arr);
          break;
        }
    }
    return isSuccess;
  }
  completionOfReadingLogs() {
    if (this._session_key === undefined || this._customer_key === undefined || this._market === undefined || !this.isDateValid)
      throw new Error(logCorruptedError);
  }
}

class ClickableAction extends Action {
  get products() {
    return (this._product === undefined) ? "" : this._product.toString();
  }
  addLog(log) {
    if (super.addLog(log)) { this._attribute = undefined; return; }
    let arr = this._attrs.pop();
    switch (arr[0]) {
      case "attribute":
        {
          this._attribute = arr[1];
          if (this._attribute != "product_key")
            throw new Error("unknown attribute");
          break;
        }
      case "value":
        {
          this._product_key = arr[1];
          break;
        }
      case "subValue":
        {
          if (this._attribute === undefined)
            throw new Error("syntax error");
          this._variant_key = arr[1];
          break;
        }
      case "product_key":
        {
          this._product_key = arr[1];
          this._attribute = undefined;
          break;
        }
      case "variant_key":
        {
          this._variant_key = arr[1];
          this._attribute = undefined;
          break;
        }
      default:
        {
          break;
        }

    }
  }
  completionOfReadingLogs() {
    super.completionOfReadingLogs();
    if (this._product_key === undefined)
      throw new Error(logCorruptedError);
    this._product = new productClass.Product(this._product_key, this._variant_key);
  }
}

class ClickAction extends ClickableAction {
  exec(session) {
    session.addToClicks(this._product, this.date);
  }
}

class NonClickAction extends ClickableAction {
  exec(session) {
    session.addToNonClicks(this._product, this.date);
  }
}

class AddToCartAction extends ClickableAction {
  exec(session) {
    session.addToCart(this._product, this.date);
  }
}

class NonAddToCart extends ClickableAction {
  exec(session) {
    session.nonAddtoCart(this._product, this.date);
  }
}

class PaymentAction extends Action {
  get products() {
    return (this._products === undefined) ? "" : this._products.join(', ');
  }
  addLog(log) {
    if (super.addLog(log)) { return; }
    let arr = this._attrs.pop();
    switch (arr[0]) {
      case "product_keys":
        {
          this._product_keys = (arr[1].substring(1, arr[1].length - 1)).split(", ");
          break;
        }
      case "variant_keys":
        {
          this._variant_keys = (arr[1].substring(1, arr[1].length - 1)).split(", ");
          break;
        }
      default:
        {
          break;
        }
    }
  }
  completionOfReadingLogs() {
    super.completionOfReadingLogs();
    if (this._product_keys.length != this._variant_keys.length)
      throw new Error(logCorruptedError);
    this._products = [];
    for (let i = 0; i < this._product_keys.length; i++) {
      let product = new productClass.Product(this._product_keys[i], this._variant_keys[i]);
      this._products.push(product);
    }
  }
  exec(session) {
    session.payment(this._products, this.date);
  }
}

class RateAction extends Action {
  get products() {
    return (this._product === undefined) ? "" : (this._product.toString() + " - " + this._rating);
  }
  addLog(log) {
    if (super.addLog(log)) { return; }
    let arr = this._attrs.pop();
    switch (arr[0]) {
      case "product_key":
        {
          this._product_key = arr[1];
          this._attribute = undefined;
          break;
        }
      case "variant_key":
        {
          this._variant_key = arr[1];
          this._attribute = undefined;
          break;
        }
      case "rating":
        {
          this._rating = arr[1];
        }
      default:
        {
          break;
        }
    }
  }
  completionOfReadingLogs() {
    super.completionOfReadingLogs();
    if (isNaN(this._rating) === true || this._product_key === undefined) {
      throw new Error(logCorruptedError);
    }
    this._product = new productClass.Product(this._product_key, this._variant_key);
  }
  exec(session) {
    session.rate(this._product, this.date);
  }
}

class EndAction extends Action {
  exec(session) {
    session.finishedSession(this._date);
  }
}

class ActionsFactory {
  constructor() {
    this._types = ["click", "adding_to_cart", "payment", "rating", "end", "non_esales_click", "non_esales_adding_to_cart"];
  }
  createAction(dateObj, type) {
    if (dateObj === undefined) throw new Error("the action must have date attribute");
    let action = undefined;
    switch (type) {
      case this._types[0]:
        action = new ClickAction(dateObj, type);
        break;
      case this._types[1]:
        action = new AddToCartAction(dateObj, type);
        break;
      case this._types[2]:
        action = new PaymentAction(dateObj, type);
        break;
      case this._types[3]:
        action = new RateAction(dateObj, type);
        break;
      case this._types[4]:
        action = new EndAction(dateObj, type);
        break;
      case this._types[5]:
        action = new NonClickAction(dateObj, type);
        break;
      case this._types[6]:
        action = new NonAddToCart(dateObj, type);
        break;
      default:
        break;
    }
    return action;
  }
}

module.exports = { ActionsFactory };