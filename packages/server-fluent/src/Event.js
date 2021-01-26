class Event {
  constructor ({ store, stream, id }) {
    this.store = store
    this.stream = stream
    this.id = id
  }

  get name () {
    return this.id
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
    return this.store.readEvent(this.account.identity, this.db.name, this.ns.name, this.stream.id, this.id, this.account.id)
  }

  async destroy () {
    return this.store.destroyEvent(this.account.identity, this.db.name, this.ns.name, this.stream.id, this.id, this.account.id)
  }
}

module.exports = Event
