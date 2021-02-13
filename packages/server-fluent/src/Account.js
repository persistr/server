class Account {
  constructor (connection, options) {
    this.connection = connection
    this.id = options?.id
    this.name = options?.name
    this.username = options?.username
  }

  get store() {
    return this.connection.store
  }

  get identity() {
    return this.connection.identity
  }

  async create (options) {
    const { password } = options
    return this.store.createAccount(this.identity, this.username, this.name, password)
  }

  async destroy () {
    return this.store.destroyAccount(this.identity, this.username)
  }

  async activate () {
    return this.store.activateAccount(this.identity, this.username)
  }

  async deactivate () {
    return this.store.deactivateAccount(this.identity, this.username)
  }

  async profile () {
    if (this.username) return this.store.findAccountByUsername(this.identity, this.username)
    return this.store.profileAccount(this.identity, this.identity.account)
  }
}

module.exports = Account
