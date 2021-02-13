const { Connection } = require('@persistr/server-fluent')
const stringify = require('../../util/stringify')
module.exports = {
  method: 'get',
  path: '/db/:db/streams',
  handler: async (req, res) => {
    res.set({ 'Content-Type': 'application/json' }).status(200)
    await stringify(Connection.from(req.credentials).db(req.params.db).streams(), res)
    res.end()
  }
}
