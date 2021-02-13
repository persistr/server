const { config } = require('@persistr/server-config')
const Errors = require('../errors')
const Schemas = require('../schemas')
const jwt = require('node-webtokens')

async function encode (payload, scheme = 'Bearer') {
  return new Promise(function (resolve, reject) {
    jwt.generate('PBES2-HS512+A256KW', 'A256GCM', payload, config.secret, (error, token) => {
      if (error) { reject(new Errors.TokenGenerationFailed({ error })); return }
      if (token.error) { reject(new Errors.TokenGenerationFailed({ error: token.error })); return }
      resolve([scheme, token].join(' ').trim())
    })
  })
}

function decode (auth, scheme = 'Bearer') {
  return new Promise(function (resolve, reject) {
    try {
      if (!auth) reject(new Errors.InvalidAuthToken({ auth }))
      const parts = auth.split(' ')
      if (parts[0] !== scheme && !parts[1]) {
        reject(new Errors.InvalidAuthToken({ auth }))
        return
      }

      const encodedToken = parts[1]
      jwt.parse(encodedToken)
        //.setTokenLifetime(120000)
        .setAlgorithmList('PBES2-HS512+A256KW', 'A256GCM')
        .setIssuer(['api.persistr.com'])
        .verify(config.secret, (error, token) => {
          if (error) { reject(new Errors.InvalidAuthToken({ auth, error })); return }
          if (token.error) { reject(new Errors.InvalidAuthToken({ auth, error: token.error })); return }
          if (scheme === 'Bearer') {
            if (!Schemas.is(token).valid('auth/bearer')) { reject(new Errors.InvalidBearerToken({ token })); return }
            resolve({
              id: token.payload.id,
              username: token.payload.sub,
              name: token.payload.name,
              dbs: token.payload.dbs || []
            })
          }
          else if (scheme === 'Apikey') {
            if (!Schemas.is(token).valid('auth/apikey')) { reject(new Errors.InvalidApiKeyToken({ token })); return }
            resolve({
              user: token.payload.user.toString('utf8'),
              ts: token.payload.ts
            })
          }
          else {
            reject(new Errors.UnknownTokenScheme({ scheme }))
          }
        })
    }
    catch (error) {
      reject(new Errors.InvalidAuthToken({ auth }))
    }
  })
}

module.exports = {
  encode,
  decode
}
