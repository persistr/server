#!/usr/bin/env node

// Dependencies.
const { Server } = require('./Server')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const { config, configFile, reload } = require('@persistr/server-config')
const Errors = require('@persistr/server-errors')
const express = require('express')
const https = require('express-https-middleware')
const yaml = require('js-yaml')
const fs = require('fs')
const prompts = require('prompts')
const passgen = require('passgen')

async function main () {
  // Display server name and version.
  const server = new Server()
  console.log(server.name)

  // Configure server if configuration file doesn't exist.
  if (!fs.existsSync(configFile)) {
    const abort = await configure(configFile)
    if (abort) {
      console.log('Configuration not completed. Rerun to complete')
      return
    }
  }

  // Remove built-in Express headers that we don't want.
  const app = express()
  app.disable('x-powered-by')

  // Create a router.
  let router = express.Router()
  app.use('/', router)

  // Configure router for Persistr.

  // Enable GZIP compression.
  router.use(compression())

  // Enable CORS.
  router.use(cors({ exposedHeaders: [ 'Authorization' ]}))

  // Register JSON body parsers.
  router.use(bodyParser.json({ type: 'application/json' }))
  router.use(Errors.json)

  // Redirect http to https.
  router.use(https.redirect)

  // Start the Persistr server.
  try {
    await server.start()
  }
  catch (error) {
    console.log('ERROR:', error.message)
    await server.stop()
    return
  }

  // Use Persistr auth middleware on every request.
  router.use(async (req, res, next) => {
    try {
      req.credentials = await server.credentials(req)
      if (req.credentials.scheme === 'Basic') await req.credentials.issue(res)
    }
    catch (error) {
      console.log('ERROR:', error.message)
    }
    next()
  })

  // Register all routes.
  const methods = ['get', 'post', 'put', 'delete']
  server.api.routes.forEach(route => {
    if (!methods.includes(route.method)) throw new Errors.UnknownHttpMethod(route.method)
    if (route.schema) {
      router[route.method](route.path, [server.api.schemas.validate(route.schema)], Errors.handle(route.handler))
    }
    else {
      router[route.method](route.path, Errors.handle(route.handler))
    }
  })

  // Register error handler.
  router.use(function (err, req, res, next) {
    console.log('SERVER ERROR')
    console.error(err.stack)
    if (res.headersSent) return next(err)
    res.status(500).send()
  })

  // Run HTTP server.
  app.listen(config.port, () => {
    console.log(`Running on port ${config.port}`)
  })
}

async function configure (configFile) {
  const { begin } = await prompts({ type: 'confirm', name: 'begin', message: 'Configure?', initial: true })
  if (!begin) return true

  const { mysql } = await prompts({ type: 'text', name: 'mysql', message: 'MySQL connection string?' })
  if (!mysql) return true

  const { port } = await prompts({ type: 'number', name: 'port', message: 'Port?', initial: 3010, min: 1 })
  if (!port) return true

  console.log(`Writing: ${configFile} ...`)
  fs.appendFileSync(configFile, yaml.dump({ secret: passgen.create(25), port, mysql }))
  console.log('done')

  reload(configFile)
}

// Run server and catch any errors.
async function run(f) { try { await f() } catch (error) { console.log(error); console.log(error.message) }}
run(main)
