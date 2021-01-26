const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/revoke',
  handler: async (req, res) => {
    let { email } = req.query
    await Account.from(req.credentials).db(req.params.db).revoke({ email })
    res.status(204).send()
  }
}
