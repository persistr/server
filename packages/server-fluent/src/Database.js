const Events = require('./Events')
const Namespace = require('./Namespace')
const Namespaces = require('./Namespaces')
const Streams = require('./Streams')

class Database {
  constructor (connection, { name }) {
    this.connection = connection
    this.name = name
  }

  get store() {
    return this.connection.store
  }

  get identity() {
    return this.connection.identity
  }

  namespaces () {
    return new Namespaces(this)
  }

  ns (name) {
    return new Namespace(this, { name })
  }

  streams () {
    return new Streams(this)
  }

  events (options) {
    return new Events(this, options)
  }

  async create () {
    return this.store.createDatabase(this.name, this.identity.account)
  }

  async clone (to) {
    return this.store.cloneDatabase(this.identity, this.name, to, this.identity.account)
  }

  async destroy () {
    return this.store.destroyDatabase(this.identity, this.name, this.identity.account)
  }

  async rename (name) {
    return this.store.renameDatabase(this.identity, this.name, name, this.identity.account)
  }

  async grant({ role, username }) {
    return this.store.grantAccount(this.identity, this.name, role, username, this.identity.account)
  }

  async revoke({ username }) {
    return this.store.revokeAccount(this.identity, this.name, username, this.identity.account)
  }
}

module.exports = Database
