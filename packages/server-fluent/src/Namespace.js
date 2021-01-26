const Events = require('./Events')
const Stream = require('./Stream')
const Streams = require('./Streams')

class Namespace {
  constructor ({ store, db, name }) {
    this.store = store
    this.db = db
    this.name = name
  }

  get account() {
    return this.db.account
  }

  streams () {
    return new Streams({ store: this.store, ns: this })
  }

  stream (id) {
    return new Stream({ store: this.store, ns: this, stream: id })
  }

  events (options) {
    return new Events({ ...options, store: this.store, ns: this })
  }

  async create () {
    return this.store.createNamespace(this.account.identity, this.name, this.db.name, this.account.id)
  }

  async destroy () {
    return this.store.destroyNamespace(this.account.identity, this.name, this.db.name, this.account.id)
  }

  async truncate () {
    return this.store.truncateNamespace(this.account.identity, this.name, this.db.name, this.account.id)
  }

  async rename (name) {
    return this.store.renameNamespace(this.account.identity, this.db.name, this.name, name, this.account.id)
  }
}

module.exports = Namespace
