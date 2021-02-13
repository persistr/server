class Annotation {
  constructor (stream) {
    this.stream = stream
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

  get db() {
    return this.ns.db
  }

  get ns() {
    return this.stream.ns
  }

  async read () {
    return this.store.readAnnotation(this.identity, this.db.name, this.ns.name, this.stream.id, this.identity.account)
  }

  async destroy () {
    return this.store.destroyAnnotation(this.identity, this.db.name, this.ns.name, this.stream.id, this.identity.account)
  }
}

module.exports = Annotation
