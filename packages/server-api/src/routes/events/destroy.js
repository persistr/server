const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/ns/:ns/streams/:stream/events/:event',
  handler: async (req, res) => {
    await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).event(req.params.event).destroy()
    res.status(204).send()
  }
}
