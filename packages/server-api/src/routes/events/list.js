const { Account } = require('@persistr/server-fluent')
const querystring = require('querystring')
module.exports = {
  method: 'get',
  path: '/db/:db/ns/:ns/streams/:stream/events',
  handler: async (req, res) => {
    if ((!req.header('Accept') && !req.query.until && !req.query.to) || req.header('Accept') === 'application/json') {
      // 406 Not Acceptable if request is for live events and JSON media type.
      if (!req.query.until && !req.query.to) throw new JSONStreamingNotSupported()

      // Not streaming. Return standard JSON back to the client.
      res.set({ 'Content-Type': 'application/json' }).status(200)
      const stream = Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream)
      const types = req.query.types ? `${decodeURIComponent(req.query.types)}`.split(',') : undefined
      let results = await stream.events({ schema: 'jsonapi', types, from: req.query.from, after: req.query.after, to: req.query.to, until: req.query.until || 'caught-up', limit: req.query.limit }).all()
      if (req.query.schema === 'jsonapi') {
        res.json({
          meta: {
            ...results.meta
          },
          links: {
            next: `/db/${req.params.db}/ns/${req.params.ns}/streams/${req.params.stream}/events?${querystring.stringify(results.links.next)}`
          },
          data: results.data
        })
      }
      else {
        res.json(results.data)
      }
    }
    else if (req.header('Accept') === 'text/event-stream' || (!req.header('Accept') && (req.query.until || req.query.to))) {
      // Stream events via SSE. Can be done for both historical and live events.

      req.on('close', function() {
        // Stop streaming events.
        events.push(null)
      })

      // Send SSE headers.
      res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
      })
      res.flushHeaders()

      // Direct the client to retry every 10 seconds if connectivity is lost.
      res.write('retry: 10000\n\n')

      const stream = Account.from(req.credentials).db(req.params.db).ns(req.params.ns).stream(req.params.stream)
      const types = req.query.types ? `${decodeURIComponent(req.query.types)}`.split(',') : undefined
      const events = stream.events({
        schema: 'jsonapi',
        types,
        from: req.query.from,
        after: req.query.after,
        to: req.query.to,
        until: req.query.until,
        limit: req.query.limit
      })

      await events.each(event => {
        // Stream the event to the client.
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      })

      res.end()
    }
  }
}
