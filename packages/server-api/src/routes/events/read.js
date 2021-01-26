const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'get',
  path: '/db/:db/ns/:ns/streams/:stream/events/:event',
  handler: async (req, res) => {
    var event = await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).event(req.params.event).read()
    res.status(200).json(event)
  }
}
