var mysql = require('mysql')

const writeLimit = process.env.MYSQL_WRITE_CONNECTIONS
let writeSSL = {}
if (process.env.MYSQL_WRITE_SSL) writeSSL.ssl = process.env.MYSQL_WRITE_SSL
var writePool

const readLimit = process.env.MYSQL_READ_CONNECTIONS
let readSSL = {}
if (process.env.MYSQL_READ_SSL) readSSL.ssl = process.env.MYSQL_READ_SSL
var hosts = process.env.MYSQL_READ_HOST.split(';')
var readPool

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
        connection.query(sql, params || [])
          .on('end', () => {
            connection.release()
            if (options.end) options.end()
            resolve()
          })
          .stream({ highWaterMark: 5 })
          .on('data', (row) => {
            options.each(row)
          })
          .on('error', (error) => {
            if (options.error) options.error(error)
            reject(error)
          })
          .on('close', () => {
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

    writePool = mysql.createPool({
      connectionLimit: writeLimit,
      host: process.env.MYSQL_WRITE_HOST,
      port: process.env.MYSQL_WRITE_PORT,
      user: process.env.MYSQL_WRITE_USER,
      password: process.env.MYSQL_WRITE_PASSWORD,
      database: process.env.MYSQL_WRITE_DATABASE,
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
        port: process.env.MYSQL_READ_PORT,
        user: process.env.MYSQL_READ_USER,
        password: process.env.MYSQL_READ_PASSWORD,
        database: process.env.MYSQL_READ_DATABASE,
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
