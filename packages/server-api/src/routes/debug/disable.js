const debug = require('@persistr/server-debug')
module.exports = {
  method: 'post',
  path: '/debug/disable',
  handler: async (req, res) => {
    if (req.query.module) debug.disable(req.query.module)
    res.status(200).send()
  }
}
