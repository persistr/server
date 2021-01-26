const Errors = require('@persistr/server-errors')
module.exports = class InvalidBearerToken extends Errors.PersistrError {
  constructor ({ token, error }) {
    if (error) { super(`Invalid Bearer token\nWhat went wrong:\n${error.message}`, 401); return }
    super(`Invalid Bearer token`, 401)
  }
}
