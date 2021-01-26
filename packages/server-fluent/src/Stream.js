const Annotation = require('./Annotation')
const Event = require('./Event')
const Events = require('./Events')

class Stream {
  constructor ({ store, ns, stream }) {
    this.store = store
    this.ns = ns
    this.id = stream
  }

  get account() {
    return this.db.account
  }

  get db() {
    return this.ns.db
  }

  events (options) {
    return new Events({ ...options, store: this.store, stream: this })
  }

  event (id) {
    return new Event({ store: this.store, stream: this, id })
  }

  annotation () {
    return new Annotation({ store: this.store, stream: this })
  }

  async annotate (annotation) {
    return this.store.writeAnnotation(this.account.identity, this.db.name, this.ns.name, this.id, annotation, this.account.id)
  }

  async destroy () {
    return this.store.destroyStream(this.account.identity, this.db.name, this.ns.name, this.id, this.account.id)
  }
}

module.exports = Stream
