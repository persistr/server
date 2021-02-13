class Accounts {
  constructor (connection) {
    this.connection = connection
  }

  get store() {
    return this.connection.store
  }

  get identity() {
    return this.connection.identity
  }

  async each (callback) {
    return this.store.listAccounts(this.identity, callback)
  }

  async all() {
    let accounts = []
    await this.each(account => accounts.push(account))
    accounts.sort((a, b) => a.username.localeCompare(b.username))
    return accounts
  }
}

module.exports = Accounts
