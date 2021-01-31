const Database = require('./Database')
const Databases = require('./Databases')

class Account {
  static from(credentials) {
    return new Account({ account: credentials.summary, store: credentials.store, identity: credentials.identity })
  }

  constructor ({ account, identity, store }) {
    this.id = account.id
    this.email = account.email
    this.name = account.name
    this.dbs = account.dbs
    this.identity = identity
    this.store = store
  }

  async profile () {
    return this.store.profileAccount(this.identity, this.id)
  }

  async destroy () {
    return this.store.destroyAccount(this.identity, this.id)
  }

  dbs () {
    return new Databases({ store: this.store, account: this })
  }

  db (name) {
    return new Database({ store: this.store, account: this, name })
  }

  databases () {
    return this.dbs()
  }

  database (name) {
    return this.db(name)
  }
}

module.exports = Account
