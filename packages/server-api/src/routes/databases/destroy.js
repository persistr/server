const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db',
  handler: async (req, res) => {
    await Account.from(req.credentials).db(req.params.db).destroy()
    await req.credentials.reissue(res)
    res.status(204).send()
  }
}
