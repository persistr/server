const debug = require('debug')

// Set all output to use console.info.
// Overrides all per-namespace log settings.
debug.log = console.info.bind(console)

module.exports = debug
