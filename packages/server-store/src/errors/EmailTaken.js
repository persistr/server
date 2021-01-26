const Errors = require('@persistr/server-errors')
module.exports = class EmailTaken extends Errors.PersistrError {
  constructor (email) {
    super(`Account with email ${email} already exists`, 400)
  }
}
