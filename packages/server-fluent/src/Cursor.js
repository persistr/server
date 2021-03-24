const CursorEvents = require('./CursorEvents')

class Cursor {
  constructor(db, name, options) {
    this.db = db
    this.name = name
    this.options = options ?? {}
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

  async create() {
    return this.store.createCursor(this.identity, this.db.name, this.name, this.options)
  }

  async destroy() {
    return this.store.destroyCursor(this.identity, this.db.name, this.name)
  }

  async rewind() {
    return this.store.rewindCursor(this.identity, this.db.name, this.name)
  }

  async read() {
    return this.store.readCursor(this.identity, this.db.name, this.name)
  }

  async advance(last) {
    return this.store.advanceCursor(this.identity, this.db.name, this.name, last)
  }

  events() {
    return new CursorEvents(this.db, { cursor: this.name })
  }
}

module.exports = Cursor
