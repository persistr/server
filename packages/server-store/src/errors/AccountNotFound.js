const Errors = require('@persistr/server-errors')
module.exports = class AccountNotFound extends Errors.PersistrError {
  constructor () {
    super(`Account not found`, 404)
  }
}
