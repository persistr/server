const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'delete',
  path: `/accounts/:username`,
  handler: async (req, res) => {
    const username = req.params.username
    await Connection.from(req.credentials).account({ username }).destroy()
    await req.credentials.revoke()
    res.status(204).send()
  }
}
