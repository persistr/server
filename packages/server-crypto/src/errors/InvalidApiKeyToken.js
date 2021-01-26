const Errors = require('@persistr/server-errors')
module.exports = class InvalidApiKeyToken extends Errors.PersistrError {
  constructor ({ token, error }) {
    if (error) { super(`Invalid Apikey token\nWhat went wrong:\n${error.message}`, 401); return }
    super(`Invalid Apikey token`, 401)
  }
}
