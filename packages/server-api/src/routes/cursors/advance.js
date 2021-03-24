const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: '/db/:db/cursors/:name/advance',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).cursor(req.params.name).advance(req.query.last)
    res.status(204).send()
  }
}
