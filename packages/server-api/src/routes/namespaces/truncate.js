const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/ns/:ns/contents',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).truncate()
    res.status(204).send()
  }
}
