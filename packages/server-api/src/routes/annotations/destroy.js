const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/ns/:ns/streams/:stream/annotation',
  handler: async (req, res) => {
    await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).annotation().destroy()
    res.status(204).send()
  }
}
