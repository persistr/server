const { Account } = require('@persistr/server-fluent')
const stringify = require('../../util/stringify')
module.exports = {
  method: 'get',
  path: '/db/:db/ns',
  handler: async (req, res) => {
    res.set({ 'Content-Type': 'application/json' }).status(200)
    await stringify(Account.from(req.credentials).db(req.params.db).namespaces(), res)
    res.end()
  }
}
