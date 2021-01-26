class Databases {
  constructor ({ store, account }) {
    this.store = store
    this.account = account
  }

  async each (callback) {
    return this.store.listDatabases(this.account.id, callback)
  }
}

module.exports = Databases
