const Errors = require('@persistr/server-errors')
module.exports = class Forbidden extends Errors.PersistrError {
  constructor (role, db) {
    super(`Action requires ${role} privileges${db ? ' on ' + db : ''}`, 403)
  }
}
