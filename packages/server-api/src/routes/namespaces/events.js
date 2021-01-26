const { Account } = require('@persistr/server-fluent')
const querystring = require('querystring')
module.exports = {
  method: 'get',
  path: '/db/:db/ns/:ns/events',
  handler: async (req, res) => {
    res.set({ 'Content-Type': 'application/json' }).status(200)
    let ns = Account.from(req.credentials).db(req.params.db).ns(req.params.ns)
    let types = req.query.types ? `${decodeURIComponent(req.query.types)}`.split(',') : undefined
    let results = await ns.events({ schema: 'jsonapi', types, from: req.query.from, after: req.query.after, to: req.query.to, until: req.query.until || 'caught-up', limit: req.query.limit }).all()
    if (req.query.schema === 'jsonapi') {
      res.json({
        meta: {
          ...results.meta
        },
        links: {
          next: `/db/${req.params.db}/ns/${req.params.ns}/events?${querystring.stringify(results.links.next)}`
        },
        data: results.data
      })
    }
    else {
      res.json(results.data)
    }
  }
}
