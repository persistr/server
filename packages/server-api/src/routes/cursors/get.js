const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'get',
  path: '/db/:db/cursors/:name',
  handler: async (req, res) => {
    const cursor = await Connection.from(req.credentials).db(req.params.db).cursor(req.params.name).read()
    res.status(200).json(cursor)
  }
}
