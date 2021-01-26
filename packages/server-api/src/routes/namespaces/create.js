const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'put',
  path: '/db/:db/ns/:ns',
  handler: async (req, res) => {
    await Account.from(req.credentials).db(req.params.db).ns(req.params.ns).create()
    res.status(204).send()
  }
}
