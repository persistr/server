const Errors = require('@persistr/server-errors')
module.exports = class NamespaceTaken extends Errors.PersistrError {
  constructor (ns) {
    super(`Namespace ${ns} is already in use`, 400)
  }
}
