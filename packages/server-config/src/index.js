const Errors = require('./errors')
const { ConnectionStringParser } = require('connection-string-parser')
const yaml = require('js-yaml')
const fs   = require('fs')
const Schemas = require('./schemas')
const os = require('os')

// Location of the config file.
const configFile = `${os.homedir}/.persistr-server/config.yaml`
let config = {}

const reload = (file) => {
  // Read file.
  try {
    const configObject = yaml.load(fs.readFileSync(file, 'utf8'))
    Object.assign(config, configObject)
  }
  catch (error) {
    throw new Errors.InvalidConfigFile(error)
  }

  // Validate config.
  if (!Schemas.is(config).valid('config/file')) throw(new Errors.InvalidConfigFile())

  // Parse MySQL connection string.
  const connectionStringParser = new ConnectionStringParser({ scheme: "mysql", hosts: [] })
  const cxn = connectionStringParser.parse(config.mysql)
  cxn.host = { name: cxn.hosts?.[0]?.host, port: cxn.hosts?.[0]?.port }
  cxn.host = cxn.host || {}

  config.mysql = {
    url: config.mysql,
    connections: process.env.PERSISTR_MYSQL_CONNECTIONS || cxn.options?.connections || 1,
    SSL: process.env.PERSISTR_MYSQL_SSL || cxn.options?.ssl,
    host: process.env.PERSISTR_MYSQL_HOST || cxn.host.name,
    port: process.env.PERSISTR_MYSQL_PORT || cxn.host.port,
    user: process.env.PERSISTR_MYSQL_USER || cxn.username,
    password: process.env.PERSISTR_MYSQL_PASSWORD || cxn.password,
    database: process.env.PERSISTR_MYSQL_DATABASE || cxn.endpoint,
    write: {
      connections: process.env.PERSISTR_MYSQL_WRITE_CONNECTIONS || cxn.options?.connections || 1,
      SSL: process.env.PERSISTR_MYSQL_WRITE_SSL || cxn.options?.ssl,
      host: process.env.PERSISTR_MYSQL_WRITE_HOST || cxn.host.name,
      port: process.env.PERSISTR_MYSQL_WRITE_PORT || cxn.host.port,
      user: process.env.PERSISTR_MYSQL_WRITE_USER || cxn.username,
      password: process.env.PERSISTR_MYSQL_WRITE_PASSWORD || cxn.password,
      database: process.env.PERSISTR_MYSQL_WRITE_DATABASE || cxn.endpoint
    },
    read: {
      connections: process.env.PERSISTR_MYSQL_READ_CONNECTIONS || cxn.options?.connections || 1,
      SSL: process.env.PERSISTR_MYSQL_READ_SSL || cxn.options?.ssl,
      host: process.env.PERSISTR_MYSQL_READ_HOST || cxn.host.name,
      port: process.env.PERSISTR_MYSQL_READ_PORT || cxn.host.port,
      user: process.env.PERSISTR_MYSQL_READ_USER || cxn.username,
      password: process.env.PERSISTR_MYSQL_READ_PASSWORD || cxn.password,
      database: process.env.PERSISTR_MYSQL_READ_DATABASE || cxn.endpoint
    }
  }

  // Set defaults and/or environment overrides.
  if (!config.port) config.port = 3010
  config.port = process.env.PORT || config.port
}

// Parse the config file.
if (fs.existsSync(configFile)) reload(configFile)

module.exports = {
  configFile,
  config,
  reload
}
