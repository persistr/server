const fs = require('fs')

var routes = new Map()

function register (router, subfolder) {
  fs.readdirSync(`${__dirname}/${subfolder}`).forEach(file => {
    // Ignore subfolders.
    const stats = fs.statSync(`${__dirname}/${subfolder}/${file}`)
    if (stats.isDirectory()) return

    // Ignore anything not a .js file.
    if (!`${file}`.endsWith('.js')) return

    // Register individual route.
    var route = require(`./${subfolder}/${file}`)
    routes.set(`${subfolder}/${file}`, route)
  })
}

var Routes = {}

Routes.register = function (router) {
  // Register all routes contained in each subfolder.
  const folder = __dirname
  fs.readdirSync(folder).forEach(subfolder => {
    const stats = fs.statSync(`${folder}/${subfolder}`)
    if (stats.isDirectory()) {
      register(router, `${subfolder}`)
    }
  })
  return Routes
}

Routes.forEach = function (fn) {
  routes.forEach((value, key, map) => {
    fn(value, key)
  })
  return Routes
}

Routes.get = function (key) {
  return routes.get(key)
}

Routes.routes = routes

module.exports = Routes
