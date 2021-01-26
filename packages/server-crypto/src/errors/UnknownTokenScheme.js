const Errors = require('@persistr/server-errors')
module.exports = class UnknownTokenScheme extends Errors.PersistrError {
  constructor ({ scheme, error }) {
    if (error) { super(`Unknown token scheme: ${scheme}\nWhat went wrong:\n${error.message}`, 401); return }
    super(`Unknown token scheme: ${scheme}`, 401)
  }
}
