const Errors = require('@persistr/server-errors')
module.exports = class StreamNotSpecified extends Errors.PersistrError {
  constructor (space, domain) {
    super(`Can't write event directly to domain ${space}.${domain}. Specify stream instead.`, 405)
  }
}
