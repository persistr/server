const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: `/accounts/:username/deactivate`,
  handler: async (req, res) => {
    const username = req.params.username
    await Connection.from(req.credentials).account({ username }).deactivate()
    res.status(204).send()
  }
}
