const debug = require('@persistr/server-debug')
module.exports = {
  method: 'post',
  path: '/debug/enable',
  handler: async (req, res) => {
    if (req.query.module) debug.enable(req.query.module)
    res.status(200).send()
  }
}
