const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/ns/:ns/streams/:stream',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).destroy()
    res.status(204).send()
  }
}
