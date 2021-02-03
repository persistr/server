// Dependencies.
const { Server } = require('./Server')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const Errors = require('@persistr/server-errors')
const express = require('express')
const https = require('express-https-middleware')

async function main () {
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
  let server = new Server()
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
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`${server.name} running on port ${port}`)
  })
}

// Run server and catch any errors.
async function run(f) { try { await f() } catch (error) { console.log(error.message) }}
run(main)
