class Annotation {
  constructor ({ store, stream }) {
    this.store = store
    this.stream = stream
  }

  get account() {
    return this.db.account
  }

  get db() {
    return this.ns.db
  }

  get ns() {
    return this.stream.ns
  }

  async read () {
    return this.store.readAnnotation(this.account.identity, this.db.name, this.ns.name, this.stream.id, this.account.id)
  }

  async destroy () {
    return this.store.destroyAnnotation(this.account.identity, this.db.name, this.ns.name, this.stream.id, this.account.id)
  }
}

module.exports = Annotation
