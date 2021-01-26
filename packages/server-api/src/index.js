// Register all routes.
module.exports = {
  Credentials: require('./Credentials'),
  routes: require('./routes').register().routes,
  schemas: require('./schemas')
}
