class Namespaces {
  constructor ({ store, db }) {
    this.store = store
    this.db = db
  }

  get account() {
    return this.db.account
  }

  async each (callback) {
    return this.store.listNamespaces(this.account.identity, this.db.name, callback)
  }
}

module.exports = Namespaces
