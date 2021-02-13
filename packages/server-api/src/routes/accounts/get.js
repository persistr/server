const { Connection } = require('@persistr/server-fluent')
module.exports = {
  method: 'get',
  path: '/accounts/current',
  handler: async (req, res) => {
    const profile = await Connection.from(req.credentials).account().profile()
    res.status(200).json({ id: profile.id, username: profile.username, name: profile.name, dbs: profile.dbs })
  }
}
