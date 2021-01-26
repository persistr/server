const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/accounts/:account',
  handler: async (req, res) => {
    await Account.from(req.credentials).destroy()
    await req.credentials.revoke()
    res.status(204).send()
  }
}
