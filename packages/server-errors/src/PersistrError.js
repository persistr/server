module.exports = class PersistrError extends Error {
  constructor (message, status) {
    // Calling base class constructor.
    super(message)

    // Saving class name in the property of our custom error as a shortcut.
    this.name = this.constructor.name

    // Capturing stack trace, excluding constructor call from it.
    Error.captureStackTrace(this, this.constructor)

    // Set the preferred HTTP status for this error type.
    // `500` is the default value unless otherwise specified.
    this.status = status || 500
  }
}
