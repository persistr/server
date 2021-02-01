const Stream = require('./Stream')

class Streams {
  constructor ({ store, db, ns }) {
    this.store = store
    this._db = db
    this.ns = ns
  }

  get db() {
    return this._db || this.ns.db
  }

  get account() {
    return this.db.account
  }

  async each (callback) {
    return this.store.listStreams(this.account.identity, this.db.name, this.ns?.name, callback)
  }
}

module.exports = Streams
