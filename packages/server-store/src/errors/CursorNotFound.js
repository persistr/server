const Errors = require('@persistr/server-errors')
module.exports = class CursorNotFound extends Errors.PersistrError {
  constructor () {
    super(`Cursor not found`, 404)
  }
}
