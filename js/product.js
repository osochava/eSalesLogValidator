class Product {
  constructor(product_key, variant_key) {
    this._product_key = product_key;
    this._variant_key = variant_key;
  }
  updateVariantKey(key) {
    this._variant_key = key;
  }
  equals(object) {
    if (object._product_key === this._product_key && object._variant_key === this._variant_key)
      return true;
    return false;
  }
  toString() {
    return (this._variant_key === undefined) ? this._product_key : this._variant_key;
  }
}

module.exports = { Product };