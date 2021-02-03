const { Credentials, routes, schemas } = require('@persistr/server-api')
const { Store } = require('@persistr/server-store')
const Errors = require('./errors')
const pkg = require('../package.json')

class Server {
  constructor (options) {
    this.name = `${pkg.description} v${pkg.version}`
    this.options = options
    this.api = { routes, schemas }
    this.store = new Store(this.options)
  }

  async start () {
    return this.store.connect()
  }

  async stop () {
    return this.store.disconnect()
  }

  async credentials (arg) {
    if (typeof arg === 'object' && arg.username && arg.name && arg.password) {
      return await Credentials.fromSignup(this.store, arg.username, arg.name, arg.password)
    }
    else if (typeof arg === 'object' && arg.username && arg.password) {
      return await Credentials.fromLogin(this.store, arg.username, arg.password)
    }
    else if (typeof arg === 'object' && arg.key) {
      return await Credentials.fromApiKey(this.store, arg.key)
    }
    else if (typeof arg === 'object' && arg.headers.authorization && arg.headers.authorization.trim().startsWith('Apikey ')) {
      return await Credentials.fromApiKey(this.store, arg.headers.authorization)
    }
    else if (typeof arg === 'object' && arg.headers.authorization && arg.headers.authorization.trim().startsWith('Bearer ')) {
      return await Credentials.fromAuthenticatedRequest(this.store, arg)
    }
    else if (typeof arg === 'object' && arg.headers.authorization && arg.headers.authorization.trim().startsWith('Basic ')) {
      const [ scheme, token ] = arg.headers.authorization.split(' ')
      const [ username, password ] = Buffer.from(token, 'base64').toString('utf8').split(':')
      return await Credentials.fromLogin(this.store, username, password)
    }
    throw new Errors.Unauthenticated()
  }
}

module.exports = { Server }
