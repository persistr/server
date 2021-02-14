const AsyncQueue = require('async-queue')
const { DateTime } = require('luxon')
const { Duplex } = require('stream')
const Event = require('./Event')

class Events extends Duplex {
  constructor (db, { ns, stream, types, from, after, to, until, limit, schema }) {
    super({ objectMode: true })

    this.db = db
    this.ns = ns
    this.stream = stream
    this.types = Array.isArray(types) ? types : (types ? [ types ] : undefined)
    this.from = from
    this.after = after
    this.to = to
    this.until = until
    this.limit = limit
    this.schema = schema

    this.shouldRead = true

    const listener = function({ account, event }) {
      if (this.db.name !== event.meta.db) return
      if (this.ns !== undefined && this.ns !== event.meta.ns) return
      if (this.stream && this.stream !== event.meta.stream) return
      if (this.types && !this.types.includes(event.meta.type)) return
      this.push({ data: [ event ]})
    }
    this.listener = listener.bind(this)
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

  _write (params, encoding, callback) {
    if (!this.stream) throw new Errors.StreamNotSpecified(this.db.name, this.ns)
    this.store.writeEvent(
      this.identity,
      {
        data: params.data ?? {},
        meta: { ...(params.meta ?? {}), db: this.db.name, ns: this.ns, stream: this.stream }
      },
      this.identity.account)
    .then(callback())
    .catch((err) => callback(err))
  }

  async write(event, callback) {
    await this.store.writeEvent(
      this.identity,
      {
        data: event.data ?? {},
        meta: { ...(event.meta ?? {}), db: this.db.name, ns: this.ns, stream: this.stream }
      },
      this.identity.account)
    return 1
  }

  async _read (size) {
    // Guard: Only initiate reading from the event stream once.
    if (!this.shouldRead) return
    this.shouldRead = false

    // Read historical events from the stream.
    if (this.after !== 'past-events') {
      let results = await this.store.listEvents(this.identity, { db: this.db.name, ns: this.ns, stream: this.stream, types: this.types, from: this.from, after: this.after, to: this.to, until: this.until, limit: this.limit })
        .catch(err => this.emit('error', err))
      if (results && results.data) {
        this.push(results)
      }
    }

    // Guard: Exit early if we don't want to read real-time events from the stream.
    if (this.until) { this.push(null); return }

    // Read real-time events from the stream.
    this.store.on('eventwritten', this.listener)
  }

  async each(callback) {
    return new Promise(async (resolve, reject) => {
      let queue = new AsyncQueue()
      this.on('end', () => {
        this.store.removeListener('eventwritten', this.listener)
        resolve(this)
      })
      this.on('error', (err) => {
        this.store.removeListener('eventwritten', this.listener)
        reject(err)
      })
      this.on('data', results => {
        queue.run(async (err, job) => {
          for (let event of results.data) {
            await callback(event)
            job.success()
          }
        })
      })
    })
  }

  async all() {
    let results = undefined
    return new Promise(async (resolve, reject) => {
      this.on('end', () => {
        resolve(results)
      })
      this.on('error', (error) => {
        reject(error)
      })
      this.on('data', data => {
        results = data
      })
    })
  }
}

module.exports = Events
