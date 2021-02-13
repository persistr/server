const Events = require('./Events')
const Stream = require('./Stream')
const Streams = require('./Streams')

class Namespace {
  constructor (db, { name }) {
    this.db = db
    this.name = name
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

  streams () {
    return new Streams(this.db, { ns: this.name })
  }

  stream (id) {
    return new Stream(this.db, { ns: this.name, stream: id })
  }

  events (options) {
    return new Events(this.db, { ...options, ns: this.name })
  }

  async create () {
    return this.store.createNamespace(this.identity, this.name, this.db.name, this.identity.account)
  }

  async destroy () {
    return this.store.destroyNamespace(this.identity, this.name, this.db.name, this.identity.account)
  }

  async truncate () {
    return this.store.truncateNamespace(this.identity, this.name, this.db.name, this.identity.account)
  }

  async rename (name) {
    return this.store.renameNamespace(this.identity, this.db.name, this.name, name, this.identity.account)
  }
}

module.exports = Namespace
