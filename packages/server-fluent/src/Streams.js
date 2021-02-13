const Stream = require('./Stream')

class Streams {
  constructor (db, { ns }) {
    this.db = db
    this.ns = ns
  }

  get store() {
    return this.connection.store
  }

  get identity() {
    return this.connection.identity
  }

  get connection() {
    return this.db.connection
  }

  async each (callback) {
    return this.store.listStreams(this.identity, this.db.name, this.ns, callback)
  }
}

module.exports = Streams
