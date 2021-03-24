const AsyncQueue = require('async-queue')
const mysql = require('mysql')
const { config } = require('@persistr/server-config')

let writeLimit
let writeSSL = {}
let writePool

let readLimit
let readSSL = {}
let readPool

function keepAlive () {
  for (let i = 0; i < writeLimit; i++) {
    writePool.getConnection((error, connection) => {
      if (error) { return }
      connection.ping()
      connection.query('SELECT 1', (err, rows) => { connection.release() })
    })
  }
  for (let i = 0; i < readLimit; i++) {
    readPool.getConnection((error, connection) => {
      if (error) { return }
      connection.ping()
      connection.query('SELECT 1', (err, rows) => { connection.release() })
    })
  }
}

var keepAliveTimer

/**
 * Acquires a connection from an internal pool and runs the query. Returns a promise.
 */
function query(pool, sql, params, options) {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      // Reject errors.
      if (error) {
        reject(error)
        return
      }

      // Perform SQL query.
      if (options && options.each) {
        // Stream results.
        let queue = new AsyncQueue()
        let resolved = false
        connection.query(sql, params || [])
          .on('end', () => {
            connection.release()
          })
          .stream({ highWaterMark: 1 })
          .on('data', (row) => {
            queue.run(async (err, job) => {
              await options.each(row)
              job.success()
              if (!queue.running && !resolved) {
                resolved = true
                if (options.end) options.end()
                resolve()
              }
            })
          })
          .on('error', (error) => {
            if (options.error) options.error(error)
            reject(error)
          })
          .on('end', () => {
            if (!queue.running && !resolved) {
              resolved = true
              if (options.end) options.end()
              resolve()
            }
          })
      } else {
        // Don't stream results.
        connection.query(sql, params || [], (error, results) => {
          connection.release()

          // Reject errors.
          if (error) {
            reject(error)
            return
          }

          // Accept results.
          resolve(results)
        })
      }
    })
  })
}

module.exports = {
  /**
   * Acquires a writable connection from an internal pool and runs the query. Returns a promise.
   */
  write: function (sql, params, options) {
    return query(writePool, sql, params, options)
  },

  /**
   * Acquires a read-only connection from an internal pool and runs the query. Returns a promise.
   */
  read: function (sql, params, options) {
    return query(readPool, sql, params, options)
  },

  begin: function() {
    if (writePool || readPool || keepAliveTimer) return

    writeLimit = config.mysql.write.connections
    writeSSL = {}
    if (config.mysql.write.ssl) writeSSL.ssl = config.mysql.write.ssl

    readLimit = config.mysql.read.connections
    readSSL = {}
    if (config.mysql.read.ssl) readSSL.ssl = config.mysql.read.ssl

    const hosts = config.mysql.read.host.split(';')

    writePool = mysql.createPool({
      connectionLimit: writeLimit,
      host: config.mysql.write.host,
      port: config.mysql.write.port,
      user: config.mysql.write.user,
      password: config.mysql.write.password,
      database: config.mysql.write.database,
      charset: 'utf8mb4',
      supportBigNumbers: true,
      multipleStatements: false,
      ...writeSSL
    })

    readPool = mysql.createPoolCluster({ restoreNodeTimeout: 10 /* ms */ })
    for (let host of hosts) {
      readPool.add({
        connectionLimit: readLimit,
        host,
        port: config.mysql.read.port,
        user: config.mysql.read.user,
        password: config.mysql.read.password,
        database: config.mysql.read.database,
        charset: 'utf8mb4',
        supportBigNumbers: true,
        multipleStatements: false,
        ...readSSL
      })
    }

    keepAliveTimer = setInterval(keepAlive, 30000)
  },

  end: function (callback) {
    return new Promise(function (resolve, reject) {
      clearInterval(keepAliveTimer)
      keepAliveTimer = undefined

      writePool.end(err => {
        if (err) {
          if (callback) callback(err)
          reject(err)
          return
        }

        writePool = undefined

        readPool.end(err => {
          if (callback) callback(err)

          if (err) {
            reject(err)
            return
          }

          readPool = undefined

          resolve()
        })
      })
    })
  }
}
