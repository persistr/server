const Account = require('./Account')
const Accounts = require('./Accounts')
const Database = require('./Database')
const Databases = require('./Databases')
const Errors = require('./errors')

class Connection {
  static from(credentials) {
    if (!credentials) throw new Errors.InvalidCredentials()
    return new Connection({ account: credentials.summary, store: credentials.store, identity: credentials.identity })
  }

  constructor ({ account, identity, store }) {
    this.id = account.id
    this.username = account.username
    this.name = account.name
    this._dbs = account.dbs
    this.identity = identity
    this.store = store
  }

  dbs () {
    return new Databases(this)
  }

  db (name) {
    return new Database(this, { name })
  }

  databases () {
    return this.dbs()
  }

  database (name) {
    return this.db(name)
  }

  accounts () {
    return new Accounts(this)
  }

  account (options) {
    return new Account(this, options)
  }
}

module.exports = Connection
