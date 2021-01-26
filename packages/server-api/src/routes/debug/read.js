const debug = require('@persistr/server-debug')
module.exports = {
  method: 'get',
  path: '/debug',
  handler: async (req, res) => {
    if (!req.query.module) { res.status(200).send(); return }
    res.status(200).json({ [req.query.module]: debug.enabled(req.query.module) })
  }
}
