const Errors = require('@persistr/server-errors')
module.exports = class InvalidCredentials extends Errors.PersistrError {
  constructor () {
    super(`Unauthenticated or invalid credentials`, 401)
  }
}
