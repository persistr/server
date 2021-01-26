const Errors = require('@persistr/server-errors')
module.exports = class Unauthenticated extends Errors.PersistrError {
  constructor (url, reason) {
    super(`Unauthenticated`, 401)
  }
}
