const fs = require('fs')

var Errors = {
  PersistrError: require('./PersistrError')
}

// Register all error classes contained in the given folder and subfolders.
Errors.register = function (folder) {
  fs.readdirSync(folder).forEach(file => {
    // Ignore subfolders.
    const stats = fs.statSync(`${folder}/${file}`)
    if (stats.isDirectory()) {
      return register(`${folder}/${file}`)
    }

    // Ignore files named 'index.js' and any not ending in '.js'.
    const fileName = `${file}`
    if (fileName === 'index.js' || !fileName.endsWith('.js')) {
      return
    }

    // Register individual error class.
    var cls = require(`${folder}/${file}`)
    Errors[cls.name] = cls
  })
  return Errors
}

// Convenience for handling HTTP errors.
Errors.handle = function (callback) {
  return async function (req, res, next) {
    try {
      await callback(req, res, next)
    } catch (error) {
      if (error instanceof Errors.PersistrError) {
        res.status(error.status).json({ error: error.message })
      } else {
        console.log(error)
        res.status(500).json({ error: 'Internal service error', internal: error.message, stack: error.stack })
      }
    }
  }
}

Errors.json = function (error, req, res, next) {
  if (error) {
    res.status(400).json({ error: `Invalid JSON body in request: ${req.originalUrl}`, internal: error.message, stack: error.stack })
  } else {
    next()
  }
}

module.exports = Errors
