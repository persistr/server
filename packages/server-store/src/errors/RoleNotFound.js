const Errors = require('@persistr/server-errors')
module.exports = class RoleNotFound extends Errors.PersistrError {
  constructor (role) {
    super(`Role "${role}" not found`, 404)
  }
}
