const Namespace = require('./Namespace')
const Namespaces = require('./Namespaces')

class Database {
  constructor ({ store, account, name }) {
    this.store = store
    this.account = account
    this.name = name
  }

  namespaces () {
    return new Namespaces({ store: this.store, db: this })
  }

  ns (name) {
    return new Namespace({ store: this.store, db: this, name })
  }

  async create () {
    return this.store.createDatabase(this.name, this.account.id)
  }

  async clone (to) {
    return this.store.cloneDatabase(this.account.identity, this.name, to, this.account.id)
  }

  async destroy () {
    return this.store.destroyDatabase(this.account.identity, this.name, this.account.id)
  }

  async rename (name) {
    return this.store.renameDatabase(this.account.identity, this.name, name, this.account.id)
  }

  async grant({ role, email }) {
    return this.store.grantAccount(this.account.identity, this.name, role, email, this.account.id)
  }

  async revoke({ email }) {
    return this.store.revokeAccount(this.account.identity, this.name, email, this.account.id)
  }
}

module.exports = Database
