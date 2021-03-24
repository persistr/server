const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: '/db/:db/cursors/:name',
  handler: async (req, res) => {
    await Connection.from(req.credentials).db(req.params.db).cursor(req.params.name).destroy()
    res.status(204).send()
  }
}
