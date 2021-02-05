const Errors = require('@persistr/server-errors')
module.exports = class InvalidConfigFile extends Errors.PersistrError {
  constructor (error) {
    super(`Invalid config file: ${error.message}`)
  }
}
