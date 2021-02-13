const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/ns/:ns',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).destroy()
    res.status(204).send()
  }
}
