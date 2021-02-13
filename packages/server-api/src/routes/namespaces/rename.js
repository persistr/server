const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/ns/:ns/rename',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).rename(req.query.to)
    res.status(204).send()
  }
}
