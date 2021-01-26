const AsyncQueue = require('async-queue')
const { DateTime } = require('luxon')
const { Duplex } = require('stream')
const Event = require('./Event')

class Events extends Duplex {
  constructor ({ store, ns, stream, types, from, after, to, until, limit, schema }) {
    super({ objectMode: true })

    this.store = store
    this._ns = ns
    this.stream = stream
    this.types = types
    this.from = from
    this.after = after
    this.to = to
    this.until = until
    this.limit = limit
    this.schema = schema

    this.shouldRead = true

    const listener = function({ account, event }) {
      if (this.stream && this.db.name === event.meta.db && this.ns.name === event.meta.ns && this.stream.id === event.meta.stream) {
        this.push({ data: [ event ]})
      }
      else if (!this.stream && this.db.name === event.meta.db && this.ns.name === event.meta.ns) {
        this.push({ data: [ event ]})
      }
    }
    this.listener = listener.bind(this)
  }

  get account() {
    return this.db.account
  }

  get db() {
    return this.ns.db
  }

  get ns() {
    return this._ns || this.stream.ns
  }

  _write (params, encoding, callback) {
    if (!this.stream) throw new Errors.StreamNotSpecified(this.db.name, this.ns.name)
    this.store.writeEvent(
      this.account.identity,
      {
        db: this.db.name,
        ns: this.ns.name,
        stream: this.stream.id,
        id: params.id,
        data: params.data,
        meta: params.meta
      },
      this.account.id)
    .then(callback())
    .catch((err) => callback(err))
  }

  async write(params, callback) {
    if (Array.isArray(params)) {
      for (const event of params) {
        await this.store.writeEvent(
          this.account.identity,
          {
            db: this.db.name,
            ns: this.ns.name,
            stream: this.stream.id,
            id: event.id,
            data: event.data,
            meta: event.meta
          },
          this.account.id)
      }
      return params.length
    }

    await this.store.writeEvent(
      this.account.identity,
      {
        db: this.db.name,
        ns: this.ns.name,
        stream: this.stream.id,
        id: params.id,
        data: params.data,
        meta: params.meta
      },
      this.account.id)
    return 1
  }

  async _read (size) {
    // Guard: Only initiate reading from the event stream once.
    if (!this.shouldRead) return
    this.shouldRead = false

    // Read historical events from the stream.
    if (this.after !== 'past-events') {
      let streamID = this.stream ? this.stream.id : undefined
      let results = await this.store.listEvents(this.account.identity, { db: this.db.name, ns: this.ns.name, stream: streamID, types: this.types, from: this.from, after: this.after, to: this.to, until: this.until, limit: this.limit })
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
