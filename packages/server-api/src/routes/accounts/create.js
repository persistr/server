const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'post',
  path: `/accounts/:username`,
  handler: async (req, res) => {
    const username = req.params.username
    const { name, password } = req.body
    await Connection.from(req.credentials).account({ name, username }).create({ password })
    res.status(204).send()
  }
}
