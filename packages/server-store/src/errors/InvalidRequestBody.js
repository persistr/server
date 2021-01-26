const Errors = require('@persistr/server-errors')
module.exports = class InvalidRequestBody extends Errors.PersistrError {
  constructor (url, reason) {
    super(`Invalid body in request: ${url}\nWhat went wrong:\n${reason}`, 400)
  }
}
