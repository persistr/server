const { Connection } = require('@persistr/server-fluent')
const stringify = require('../../util/stringify')
module.exports = {
  method: 'get',
  path: '/accounts',
  handler: async (req, res) => {
    res.set({ 'Content-Type': 'application/json' }).status(200)
    await stringify(Connection.from(req.credentials).accounts(), res)
    res.end()
  }
}
