const Errors = require('@persistr/server-errors')
module.exports = class AnnotationNotFound extends Errors.PersistrError {
  constructor (db, ns, stream) {
    super(`Annotation not found for stream ${db}.${ns}.${stream}`, 404)
  }
}
