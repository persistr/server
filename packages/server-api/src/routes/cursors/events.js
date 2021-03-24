const { Connection } = require('@persistr/server-fluent')
const querystring = require('querystring')
module.exports = {
  method: 'get',
  path: '/db/:db/cursors/:name/events',
  handler: async (req, res) => {
    // Stream cursor events via SSE.

    // Send SSE headers.
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive'
    })
    res.flushHeaders()

    // Direct the client to retry after 1 second if connectivity is lost.
    res.write('retry: 1000\n\n')

    const events = Connection.from(req.credentials).db(req.params.db).cursor(req.params.name).events()

    req.on('close', function() {
      // Stop streaming events.
      events.cancel()
    })

    await events.each(event => {
      // Stream the event to the client.
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    })

    // Send end-of-stream to the client. Client is expected to close connection.
    res.write(`event: error\ndata: \n\n`)
  }
}
