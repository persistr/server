var credentials = require('password-hash-and-salt')

async function hash (password) {
  return new Promise(function (resolve, reject) {
    credentials(password).hash(function (error, hash) {
      resolve(hash)
    })
  })
}

async function verify ({ password, against: accountPassword }) {
  return new Promise(function (resolve, reject) {
    credentials(password).verifyAgainst(accountPassword, function (error, verified) {
      if (error) { resolve(false); return }
      if (!verified) { resolve(false); return }
      resolve(true)
    })
  })
}

module.exports = {
  hash,
  verify
}
