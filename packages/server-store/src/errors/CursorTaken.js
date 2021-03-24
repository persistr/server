const Errors = require('@persistr/server-errors')
module.exports = class CursorTaken extends Errors.PersistrError {
  constructor (name) {
    super(`Cursor named '${name}' already exists`, 400)
  }
}
