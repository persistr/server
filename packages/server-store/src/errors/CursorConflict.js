const Errors = require('@persistr/server-errors')
module.exports = class CursorConflict extends Errors.PersistrError {
  constructor () {
    super(`Cursor could not be advanced due to conflict`, 409)
  }
}
