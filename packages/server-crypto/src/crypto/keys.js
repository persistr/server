const { DateTime } = require('luxon')
var jwt = require('./jwt')

async function generate (accountID) {
  return await jwt.encode({ iss: 'api.persistr.com', user: accountID, ts: DateTime.local().toMillis() }, '')
}

module.exports = {
  generate
}
