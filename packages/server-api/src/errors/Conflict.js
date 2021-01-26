const Errors = require('@persistr/server-errors')
module.exports = class Conflict extends Errors.PersistrError {
  constructor ({ stream, type, mutation }) {
    super(`Mutation '${mutation}' not allowed on out-of-date object ${stream} of type '${type}'`, 409)
  }
}
