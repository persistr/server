const Cursor = require('./Cursor')

class Cursors {
  constructor(db) {
    this.db = db
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

  cursor(name, options) {
    return new Cursor(this, { ...options, name })
  }

  async each(callback) {
    return this.store.listCursors(this.identity, this.db.name, callback)
  }

  async all() {
    let cursors = []
    await this.each(cursor => cursors.push(cursor))
    return cursors
  }
}

module.exports = Cursors
