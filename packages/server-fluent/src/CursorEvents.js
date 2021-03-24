const AsyncQueue = require('async-queue')
const { DateTime } = require('luxon')
const Event = require('./Event')

class CursorEvents {
  constructor (db, { cursor }) {
    this.db = db
    this.cursor = cursor
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

  cancel() {
    // Unregister promise.
    this.store.unregisterActiveCursor(this.cursor)
  }

  async each(callback) {
    // Read events from the cursor.
    let [ event, waitForEvent ] = await this.store.cursorEvents(this.identity, this.db.name, this.cursor)
      .catch(err => this.emit('error', err))
    while (event || waitForEvent) {
      if (event) await callback(event)

      // Await for cursor to be advanced.
      try {
        await new Promise(async (resolve, reject) => {
          // Save the promise so it can be resolved when cursor is advanced.
          this.store.registerActiveCursor(this.cursor, { resolve, reject })
        })
      }
      catch (error) {
        return
      }

      [ event, waitForEvent ] = await this.store.cursorEvents(this.identity, this.db.name, this.cursor)
        .catch(err => this.emit('error', err))
    }

    // Unregister promise.
    this.store.unregisterActiveCursor(this.cursor)
  }

  async all() {
    let events = []
    await this.each(event => events.push(event))
    return events
  }
}

module.exports = CursorEvents
