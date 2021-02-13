const Annotation = require('./Annotation')
const Event = require('./Event')
const Events = require('./Events')

class Stream {
  constructor (db, { ns, stream }) {
    this.db = db
    this.ns = ns
    this.id = stream
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

  events (options) {
    return new Events(this.db, { ...options, stream: this.id })
  }

  event (id) {
    return new Event(this, { id })
  }

  annotation () {
    return new Annotation(this)
  }

  async annotate (annotation) {
    return this.store.writeAnnotation(this.identity, this.db.name, this.ns, this.id, annotation, this.identity.account)
  }

  async destroy () {
    return this.store.destroyStream(this.identity, this.db.name, this.ns, this.id, this.identity.account)
  }
}

module.exports = Stream
