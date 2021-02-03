const Errors = require('@persistr/server-errors')
module.exports = class UsernameTaken extends Errors.PersistrError {
  constructor (username) {
    super(`Username ${username} is not available`, 400)
  }
}
