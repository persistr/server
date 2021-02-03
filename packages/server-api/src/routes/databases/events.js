const { Account } = require('@persistr/server-fluent')
const querystring = require('querystring')
module.exports = {
  method: 'get',
  path: '/db/:db/events',
  handler: async (req, res) => {
    if ((!req.header('Accept') && !req.query.until && !req.query.to) || req.header('Accept') === 'application/json') {
      // 406 Not Acceptable if request is for live events and JSON media type.
      if (!req.query.until && !req.query.to) throw new JSONStreamingNotSupported()

      // Not streaming. Return standard JSON back to the client.
      res.set({ 'Content-Type': 'application/json' }).status(200)
      const db = Account.from(req.credentials).db(req.params.db)
      const types = req.query.types ? `${decodeURIComponent(req.query.types)}`.split(',') : undefined
      let results = await db.events({ schema: 'jsonapi', ns: req.query.ns, stream: req.query.stream, types, from: req.query.from, after: req.query.after, to: req.query.to, until: req.query.until || 'caught-up', limit: req.query.limit }).all()
      if (req.query.schema === 'jsonapi') {
        res.json({
          meta: {
            ...results.meta
          },
          links: {
            next: `/db/${req.params.db}/events?${querystring.stringify(results.links.next)}`
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

      // Send SSE headers.
      res.set({
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive'
      })
      res.flushHeaders()

      // Direct the client to retry after 1 second if connectivity is lost.
      res.write('retry: 1000\n\n')

      const db = Account.from(req.credentials).db(req.params.db)
      const types = req.query.types ? `${decodeURIComponent(req.query.types)}`.split(',') : undefined
      const ns = req.query.ns ? db.ns(req.query.ns) : undefined
      const stream = req.query.stream ? (ns ? ns.stream(req.query.stream) : db.ns('').stream(req.query.stream)) : undefined
      const events = db.events({
        schema: 'jsonapi',
        ns,
        stream,
        types,
        from: req.query.from,
        after: req.query.after,
        to: req.query.to,
        until: req.query.until,
        limit: req.query.limit
      })

      req.on('close', function() {
        // Stop streaming events.
        events.push(null)
      })

      await events.each(event => {
        // Stream the event to the client.
        res.write(`data: ${JSON.stringify(event)}\n\n`)
      })

      // Send end-of-stream to the client. Client is expected to close connection.
      res.write(`event: error\ndata: \n\n`)
    }
  }
}
