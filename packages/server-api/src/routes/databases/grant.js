const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/grant',
  handler: async (req, res) => {
    let { role, email } = req.query
    await Account.from(req.credentials).db(req.params.db).grant({ role, email })
    res.status(200).send()
  }
}
