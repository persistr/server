const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/rename',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).rename(req.query.to)
    await req.credentials.reissue(res)
    res.status(204).send()
  }
}
