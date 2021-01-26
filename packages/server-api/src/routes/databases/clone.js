const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/clone',
  handler: async (req, res) => {
    let { to } = req.query
    await Account.from(req.credentials).db(req.params.db).clone(to)
    await req.credentials.reissue(res)
    res.status(204).send()
  }
}
