const Errors = require('@persistr/server-errors')
module.exports = class NotImplemented extends Errors.PersistrError {
  constructor (message) {
    super(`Not implemented${message ? ': ' + message : ''}`, 501)
  }
}
