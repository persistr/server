#!/usr/bin/env node

// Dependencies.
const { Server } = require('./Server')
const bodyParser = require('body-parser')
const compression = require('compression')
const cors = require('cors')
const { config, configFile, reload } = require('@persistr/server-config')
const Errors = require('@persistr/server-errors')
const express = require('express')
const yaml = require('js-yaml')
const fs = require('fs')
const prompts = require('prompts')
const passgen = require('passgen')
const Importer = require('mysql-import')
const kleur = require('kleur')
const os = require('os')
const mysql = require('mysql')
const { v4: uuidv4 } = require('uuid')
const uuidParse = require('uuid-parse')
const { keys, passwords } = require('@persistr/server-crypto')
const logger = require('@persistr/server-log')
const path = require('path')

async function main () {
  // Configure server if configuration file doesn't exist.
  if (!fs.existsSync(configFile)) {
    const abort = await configure(configFile)
    if (abort) {
      console.log('Configuration not completed. Rerun to complete')
      return
    }
    console.log()
  }

  // Display server name and version.
  const server = new Server()
  console.log(server.name)

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

  // Start the Persistr server.
  try {
    await server.start()
  }
  catch (error) {
    console.error(error.message + '\t' + error.stack)
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
      console.error(error.message + '\t' + error.stack)
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
    console.error(err.message + '\t' + err.stack)
    if (res.headersSent) return next(err)
    res.status(500).send()
  })

  // Run HTTP server.
  app.listen(config.port, () => {
    console.log(`Running on port ${config.port}`)

    // Override console.log() with Persistr logging.
    logger.install()
  })
}

async function configure (configFile) {
  const { begin } = await prompts({ type: 'confirm', name: 'begin', message: 'Configure?', initial: true })
  if (!begin) return true

  const { port } = await prompts({ type: 'number', name: 'port', message: 'Port?', initial: 3010, min: 1 })
  if (!port) return true

  let { username } = await prompts({ type: 'text', name: 'username', message: 'Root username?', initial: 'root' })
  if (username === undefined || username === null) return true
  username = `${username}`.trim()
  if (!username) return true

  const { password } = await prompts({ type: 'password', name: 'password', message: 'Root password?' })
  if (password === undefined || password === null) return true

  let { logfolder } = await prompts({ type: 'text', name: 'logfolder', message: 'Log folder?', initial: `${os.homedir}/.persistr-server/logs/` })
  if (logfolder === undefined || logfolder === null) return true
  logfolder = `${logfolder}`.trim()
  if (!logfolder) return true

  let { url } = await prompts({ type: 'text', name: 'url', message: 'MySQL connection string?' })
  if (url === undefined || url === null) return true
  url = `${url}`.trim()
  if (!url) return true

  if (!url.match(/^mysql:\/\/[^\/]+\/persistr($|[^a-zA-Z0-9].*$)/)) {
    console.log(`ERROR: Database name must be 'persistr'`)
    return true
  }

  fs.mkdirSync(path.dirname(configFile), { recursive: true })
  fs.writeFileSync(configFile, yaml.dump({
    secret: passgen.create(25),
    port,
    log: { folder: logfolder },
    mysql: url
  }))
  console.log(kleur.green('✔') + ` Wrote configuration to ${configFile}`)

  try {
    reload(configFile)
  }
  catch (error) {
    console.log('ERROR:', error.message)
    fs.unlinkSync(configFile)
    return true
  }

  const importer = new Importer({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password })
  try {
    await importer.import(`${__dirname}/../node_modules/@persistr/server-store/sql/`)
  }
  catch (error) {
    console.log('ERROR:', error.message)
    fs.unlinkSync(configFile)
    return true
  }
  console.log(kleur.green('✔') + ` Created MySQL 'persistr' database and tables`)

  const connection = mysql.createConnection({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
  })

  connection.connect()

  const rootAccount = {
    id: uuid2hex(uuidv4()),
    name: 'root',
    username,
    password: (await passwords.hash(password)) ?? '',
    isRoot: true,
    key: '' //await keys.generate(accountID)
  }
  try {
    await new Promise((resolve, reject) => {
      connection.query('INSERT INTO Accounts SET ?', rootAccount, function (error, results, fields) {
        if (error) reject(error)
        else resolve()
      })
    })
  }
  catch (error) {
    console.log('ERROR:', error.message)
    connection.end()
    return
  }
  console.log(kleur.green('✔') + ` Created root account`)

  const { demo } = await prompts({ type: 'confirm', name: 'demo', message: 'Create demo account?', initial: true })
  if (!demo) return

  const demoAccount = {
    id: uuid2hex(uuidv4()),
    name: 'demo',
    username: 'demo',
    password: (await passwords.hash('demo')) ?? '',
    key: '' //await keys.generate(accountID)
  }
  try {
    await new Promise((resolve, reject) => {
      connection.query('INSERT INTO Accounts SET ?', demoAccount, function (error, results, fields) {
        if (error) reject(error)
        else resolve()
      })
    })
  }
  catch (error) {
    console.log('ERROR:', error.message)
    connection.end()
    return
  }
  console.log(kleur.green('✔') + ` Created demo account`)

  connection.end()
}

function uuid2hex (uuid) {
  return Buffer.from(uuidParse.parse(uuid))
}

// Run server and catch any errors.
async function run(f) { try { await f() } catch (error) { console.error(error) }}
run(main)
