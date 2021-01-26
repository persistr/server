const Errors = require('@persistr/server-errors')
module.exports = class TokenGenerationFailed extends Errors.PersistrError {
  constructor ({ error }) {
    if (error) { super(`Token generation failed\nWhat went wrong:\n${error.message}`, 500); return }
    super(`Token generation failed`, 500)
  }
}
