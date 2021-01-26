const { name, version, description } = require('../../../package.json')
module.exports = {
  method: 'get',
  path: '/',
  handler: (req, res) => {
    res.status(200).json({ description, version })
  }
}
