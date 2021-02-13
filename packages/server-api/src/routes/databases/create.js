const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'put',
  path: '/db/:db',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).create()
    await req.credentials.reissue(res)
    res.status(204).send()
  }
}
