const { Connection } = require('@persistr/server-fluent')
const stringify = require('../../util/stringify')
module.exports = {
  method: 'get',
  path: '/db/:db/ns/:ns/streams',
  handler: async (req, res) => {
    res.set({ 'Content-Type': 'application/json' }).status(200)
    await stringify(Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).streams(), res)
    res.end()
  }
}
