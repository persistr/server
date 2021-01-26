const Stream = require('./Stream')

class Streams {
  constructor ({ store, ns }) {
    this.store = store
    this.ns = ns
  }

  get db() {
    return this.ns.db
  }

  get account() {
    return this.db.account
  }

  async each (callback) {
    return this.store.listStreams(this.account.identity, this.db.name, this.ns.name, callback)
  }
}

module.exports = Streams
