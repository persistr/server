const { Account } = require('@persistr/server-fluent')
module.exports = {
  method: 'get',
  path: '/accounts/current',
  handler: async (req, res) => {
    const profile = await Account.from(req.credentials).profile()
    res.status(200).json({ id: profile.id, email: profile.email, name: profile.name, owns: profile.own, admins: profile.adm, memberof: profile.mbr, readerof: profile.rdr })
  }
}
