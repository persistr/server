const { Account } = require('@persistr/server-fluent')
const { v4: uuidv4 } = require('uuid')
module.exports = {
  method: 'post',
  path: '/events',
  schema: 'events/write',
  handler: async (req, res) => {
    const event = req.body
    await Account.from(req.credentials).db(event.meta.db).ns(event.meta.ns).stream(event.meta.stream).events().write({ id: uuidv4(), data: event.data, meta: event.meta })
    res.status(201).send()
  }
}
