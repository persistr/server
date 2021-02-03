const Identity = require('./Identity')
const { jwt } = require('@persistr/server-crypto')

class Credentials {
  static async fromAuthenticatedRequest(store, req) {
    let token = req.headers.authorization
    let summary = await jwt.decode(req.headers.authorization)
    return new Credentials(store, summary, token, 'Bearer')
  }

  static async fromApiKey(store, auth) {
    let payload = await jwt.decode(auth, 'Apikey')
    let key = auth.split(' ')[1].trim()
    let summary = await store.findAccountByKey(payload.user, key)
    return new Credentials(store, summary, auth, 'Apikey')
  }

  static async fromLogin(store, username, password) {
    let summary = await store.findAccount(username, password)
    let token = await tokenize(summary)
    return new Credentials(store, summary, token, 'Basic')
  }

  constructor(store, summary, token, scheme) {
    this.store = store
    this.summary = summary
    this.token = token
    this.scheme = scheme
    this.identity = new Identity(this.summary.id, this.summary.dbs)
  }

  async revoke() {
    // TODO
    return this
  }

  async issue(res) {
    if (this.token.startsWith('Bearer ')) res.header('authorization', this.token)
    return this
  }

  async reissue(res) {
    if (this.token.startsWith('Bearer ')) {
      await this.revoke()
      this.summary = await this.store.findAccountByID(this.summary.id)
      this.token = await tokenize(this.summary)
      await this.issue(res)
    }
    return this
  }
}

async function tokenize(summary) {
  return await jwt.encode({
    iss: 'api.persistr.com',
    sub: summary.username,
    id: summary.id,
    name: summary.name,
    dbs: summary.dbs || []
  })
}

module.exports = Credentials
