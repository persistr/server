const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/grant',
  handler: async (req, res) => {
    let { role, username } = req.query
    await Connection.from(req.credentials).db(req.params.db).grant({ role, username })
    res.status(200).send()
  }
}
