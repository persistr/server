const Errors = require('@persistr/server-errors')
module.exports = class InvalidAuthToken extends Errors.PersistrError {
  constructor ({ auth, error }) {
    if (error) { super(`Invalid auth token\nWhat went wrong:\n${error.message}`, 401); return }
    super(`Invalid auth token`, 401)
  }
}
