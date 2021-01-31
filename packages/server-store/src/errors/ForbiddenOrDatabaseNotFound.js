const Errors = require('@persistr/server-errors')
module.exports = class ForbiddenOrDatabaseNotFound extends Errors.PersistrError {
  constructor (role, db) {
    super(`Database '${db}' not found or access denied (must have ${role} privileges)`, 403)
  }
}
