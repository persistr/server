const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/revoke',
  handler: async (req, res) => {
    let { username } = req.query
    await Connection.from(req.credentials).db(req.params.db).revoke({ username })
    res.status(204).send()
  }
}
