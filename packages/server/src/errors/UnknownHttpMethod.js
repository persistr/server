const Errors = require('@persistr/server-errors')
module.exports = class UnknownHttpMethod extends Errors.PersistrError {
  constructor (method) {
    super(`Unknown HTTP method '${method}'`, 500)
  }
}
