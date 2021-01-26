const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'put',
  path: '/db/:db/ns/:ns/streams/:stream/events/:event',
  schema: 'events/write',
  handler: async (req, res) => {
    let event = await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).events().write({ id: req.params.event, data: req.body.data, meta: req.body.meta })
    res.status(201).send()
  }
}
