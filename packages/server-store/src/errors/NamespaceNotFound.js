const Errors = require('@persistr/server-errors')
module.exports = class NamespaceNotFound extends Errors.PersistrError {
  constructor (ns, db) {
    super(`Namespace ${ns} not found${db ? ' in database ' + db : ''}`, 404)
  }
}
