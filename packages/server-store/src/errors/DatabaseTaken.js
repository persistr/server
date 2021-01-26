const Errors = require('@persistr/server-errors')
module.exports = class DatabaseTaken extends Errors.PersistrError {
  constructor (db) {
    super(`Database ${db} is already in use`, 400)
  }
}
