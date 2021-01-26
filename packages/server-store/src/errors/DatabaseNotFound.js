const Errors = require('@persistr/server-errors')
module.exports = class DatabaseNotFound extends Errors.PersistrError {
  constructor (name) {
    super(`Database ${name} not found`, 404)
  }
}
