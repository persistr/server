var Ajv = require('ajv')
const Errors = require('@persistr/server-errors')
const fs = require('fs')
const path = require('path')

var validator = new Ajv()

var Schemas = {}

Schemas.register = function (root, subfolder) {
  if (!subfolder) subfolder = ''
  const folder = path.join(root, subfolder)
  fs.readdirSync(folder).forEach(file => {
    // Ignore special subfolders.
    const fileName = `${file}`
    if (fileName === '.' || fileName === '..') return Schemas

    // Register schemas contained in subfolders.
    const stats = fs.statSync(`${folder}/${file}`)
    if (stats.isDirectory()) {
      return Schemas.register(root, path.relative(root, `${folder}/${file}`))
    }

    // Ignore files not ending in '.schema.json'.
    if (!fileName.endsWith('.schema.json')) {
      return Schemas
    }

    // Compile individual JSON schemas.
    let schemaName = path.relative(root, folder) + '/' + fileName.replace(/\..*$/, '')
    let schema = JSON.parse(fs.readFileSync(`${folder}/${file}`, 'utf8'))
    validator.addSchema(schema, schemaName)
  })
  return Schemas
}

Schemas.is = function (something) {
  return {
    valid: function (schema) {
      try {
        var valid = validator.validate(schema, something)
        if (!valid) console.log(validator.errorsText())
        return valid
      } catch (error) {
        return false
      }
    }
  }
}

Schemas.validate = function (schema) {
  return function (req, res, next) {
    try {
      if (!validator.validate(schema, req.body)) {
        throw new Errors.InvalidRequestBody(req.originalUrl, validator.errorsText())
      }
    } catch (error) {
      if (error instanceof Errors.ServiceError) {
        res.status(error.status).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal service error', internal: error.message, stack: error.stack })
      }
      return
    }
    next()
  }
}

module.exports = Schemas
