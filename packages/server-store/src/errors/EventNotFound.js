const Errors = require('@persistr/server-errors')
module.exports = class EventNotFound extends Errors.PersistrError {
  constructor (db, ns, stream, event) {
    super(`Event ${event} not found in ${db}.${ns}.${stream}`, 404)
  }
}
