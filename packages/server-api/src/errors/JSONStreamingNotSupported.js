const Errors = require('@persistr/server-errors')
module.exports = class JSONStreamingNotSupported extends Errors.PersistrError {
  constructor () {
    // 406 Not Acceptable
    super(`Can't use JSON to stream live events. JSON is only supported for historical events.`, 406)
  }
}
