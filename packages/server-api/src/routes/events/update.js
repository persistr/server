const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'put',
  path: '/events/:event',
  schema: 'events/write',
  handler: async (req, res) => {
    const event = req.body
    await Connection.from(req.credentials).db(event.meta.db).ns(event.meta.ns).stream(event.meta.stream).events().write({ data: event.data, meta: event.meta })
    res.status(201).send()
  }
}
