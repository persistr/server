const Errors = require('@persistr/server-errors')
module.exports = class DuplicateEvent extends Errors.PersistrError {
  constructor (id) {
    super(`Event already exists with identifier ${id}`, 400)
  }
}
