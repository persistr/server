class Event {
  constructor (stream, { id }) {
    this.stream = stream
    this.id = id
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

  get name () {
    return this.id
  }

  async read () {
    return this.store.readEvent(this.identity, this.db.name, this.ns.name, this.stream.id, this.id, this.identity.account)
  }

  async destroy () {
    return this.store.destroyEvent(this.identity, this.db.name, this.ns.name, this.stream.id, this.id, this.identity.account)
  }
}

module.exports = Event
