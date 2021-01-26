const Errors = require('@persistr/server-errors')
module.exports = class StreamNotFound extends Errors.PersistrError {
  constructor (db, ns, stream) {
    super(`Stream ${stream} not found in ${db}.${ns}`, 404)
  }
}
