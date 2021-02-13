class Databases {
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
    return this.store.listDatabases(this.identity.account, callback)
  }
}

module.exports = Databases
