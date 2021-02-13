class Namespaces {
  constructor (db) {
    this.db = db
  }

  get store() {
    return this.connection.store
  }

  get identity() {
    return this.connection.identity
  }

  get connection() {
    return this.db.connection
  }

  async each (callback) {
    return this.store.listNamespaces(this.identity, this.db.name, callback)
  }
}

module.exports = Namespaces
