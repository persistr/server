const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'get',
  path: '/db/:db/ns/:ns/streams/:stream/annotation',
  handler: async (req, res) => {
    const annotation = await Connection.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).annotation().read()
    res.status(200).json(annotation)
  }
}
