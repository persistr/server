const { Account } = require('@persistr/server-fluent')
const uuidv4 = require('uuid/v4')
module.exports = {
  method: 'post',
  path: '/db/:db/ns/:ns/streams/:stream/events',
  schema: 'events/write',
  handler: async (req, res) => {
    let event = await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream).events().write({ id: uuidv4(), data: req.body.data, meta: req.body.meta })
    res.status(201).send()
  }
}
