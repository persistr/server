const { DateTime } = require('luxon')
const Errors = require('./errors')
const EventEmitter = require('events')
const { keys, passwords } = require('@persistr/server-crypto')
const sql = require('./util/sql')
const { to } = require('simple-promise-to-async')
const uuidParse = require('uuid-parse')
const uuidv4 = require('uuid/v4')
const wildcards = require('wildcards-to-mysql')

const kRoles = { 1: 'owner', 2: 'admin', 3: 'member', 4: 'reader' }

function uuid2hex (uuid) {
  return Buffer.from(uuidParse.parse(uuid))
}

function hex2uuid (buffer) {
  return uuidParse.unparse(buffer)
}

async function findDatabaseID (name) {
  let results = await sql.read('SELECT id FROM `Databases` WHERE `name` = ?', [ name ])
  if (!results || !results[0] || !results[0].id) throw new Errors.DatabaseNotFound(name)
  dbID = hex2uuid(results[0].id)
  return dbID
}

async function findNamespaceID (dbID, name) {
  let results = await sql.read('SELECT id FROM Namespaces WHERE db = ? AND `name` = ?', [ uuid2hex(dbID), name ])
  if (!results || !results[0] || !results[0].id) throw new Errors.NamespaceNotFound(name)
  domainID = hex2uuid(results[0].id)
  return domainID
}

async function findOrCreateNamespaceID (identity, db, dbID, name) {
  let results = await sql.read('SELECT id FROM Namespaces WHERE db = ? AND `name` = ?', [ uuid2hex(dbID), name ])
  if (results && results[0] && results[0].id) {
    const nsID = hex2uuid(results[0].id)
    return nsID
  }

  if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)

  const nsID = uuidv4()
  let [error] = await to(sql.write('INSERT INTO Namespaces SET ?', {
    db: uuid2hex(dbID),
    id: uuid2hex(nsID),
    name
  }))

  if (error && error.code === 'ER_DUP_ENTRY') throw new Errors.NamespaceTaken(name)
  if (error) throw error

  return nsID
}

async function findRoleID (role) {
  const roles = { owner: 1, admin: 2, member: 3, reader: 4 }
  const roleID = roles[role]
  if (!roleID) throw new Errors.RoleNotFound(role)
  return roleID
}

class Store extends EventEmitter {
  constructor (options) {
    super()
  }

  // Connection

  async connect () {
    await sql.begin()
  }

  async disconnect () {
    await sql.end()
  }

  // Accounts

  async findAccountID (email) {
    let results = await sql.read('SELECT `id` FROM Accounts WHERE email = ? AND isActive = 1', [ email ])
    if (!results || !results.length) throw new Errors.AccountNotFound()
    let accountID = hex2uuid(results[0].id)
    return accountID
  }

  async findAccountByID (id) {
    let results = await sql.read('SELECT `name`, `email`, `password` FROM Accounts WHERE id = ? AND isActive = 1', [ uuid2hex(id) ])
    if (!results || !results.length) throw new Errors.AccountNotFound()
    let dbs = await sql.read('SELECT Databases.name AS `name`, AccountDatabases.type AS `type` FROM Accounts, `Databases`, AccountDatabases WHERE Accounts.id = ? AND Databases.id = AccountDatabases.idDB AND Accounts.id = AccountDatabases.idAccount ORDER BY Databases.name', [ uuid2hex(id) ])
    return {
      id,
      name: results[0].name,
      email: results[0].email,
      dbs: dbs.map(db => ({ name: db.name, role: kRoles[db.type] }))
    }
  }

  async findAccount (email, password) {
    let results = await sql.read('SELECT `id`, `name`, `email`, `password` FROM Accounts WHERE email = ? AND isActive = 1', [ email ])
    if (!results || !results.length) throw new Errors.AccountNotFound()

    let accountName = results[0].name
    let accountID = hex2uuid(results[0].id)
    let accountPassword = results[0].password
    let verified = await passwords.verify({ password, against: accountPassword })
    if (!verified) throw new Errors.AccountNotFound()

    let dbs = await sql.read('SELECT Databases.name AS `name`, AccountDatabases.type AS `type` FROM Accounts, `Databases`, AccountDatabases WHERE Accounts.id = ? AND Databases.id = AccountDatabases.idDB AND Accounts.id = AccountDatabases.idAccount ORDER BY Databases.name', [ uuid2hex(accountID) ])

    return {
      id: accountID,
      name: accountName,
      email,
      dbs: dbs.map(db => ({ name: db.name, role: kRoles[db.type] }))
    }
  }

  async findAccountByKey (accountID, key) {
    let results = await sql.read('SELECT `name`, `email` FROM Accounts WHERE id = ? AND `key` = ? AND isActive = 1', [ uuid2hex(accountID), key ])
    if (!results || !results.length) throw new Errors.AccountNotFound()
    let dbs = await sql.read('SELECT Databases.name AS `name`, AccountDatabases.type AS `type` FROM Accounts, `Databases`, AccountDatabases WHERE Accounts.id = ? AND Databases.id = AccountDatabases.idDB AND Accounts.id = AccountDatabases.idAccount ORDER BY Databases.name', [ uuid2hex(accountID) ])
    return {
      id: accountID,
      name: results[0].name,
      email: results[0].email,
      dbs: dbs.map(db => ({ name: db.name, role: kRoles[db.type] }))
    }
  }

  async createAccount (email, name, password) {
    const accountID = uuidv4()
    const hashedPassword = await passwords.hash(password)
    const key = await keys.generate(accountID)
    let [error] = await to(sql.write('INSERT INTO Accounts SET ?', { id: uuid2hex(accountID), email, name, password: hashedPassword, key }))

    if (error && error.message.includes('ER_DUP_ENTRY')) throw new Errors.EmailTaken(email)
    if (error) throw error

    return { id: accountID, name, email, dbs: [], key }
  }

  async destroyAccount (identity, accountID) {
    if (!identity.is.account({ account: accountID })) throw new Errors.Forbidden('owner')
    await sql.write('DELETE FROM Events WHERE db IN (SELECT idDB AS db FROM AccountDatabases WHERE idAccount = ?)', [ uuid2hex(accountID) ])
    await sql.write('DELETE FROM Annotations WHERE db IN (SELECT idDB AS db FROM AccountDatabases WHERE idAccount = ?)', [ uuid2hex(accountID) ])
    await sql.write('DELETE FROM Namespaces WHERE db IN (SELECT idDB AS db FROM AccountDatabases WHERE idAccount = ?)', [ uuid2hex(accountID) ])
    await sql.write('DELETE FROM `Databases` WHERE id IN (SELECT idDB AS id FROM AccountDatabases WHERE idAccount = ?)', { id: uuid2hex(accountID) })
    await sql.write('DELETE FROM AccountDatabases WHERE ?', { idAccount: uuid2hex(accountID) })
    await sql.write('DELETE FROM Accounts WHERE id = ?', [ uuid2hex(accountID) ])
  }

  async profileAccount (identity, id) {
    if (!identity.is.account({ account: id })) throw new Errors.Forbidden('owner')
    return await this.findAccountByID(id)
  }

  // Databases

  async listDatabases (account, callback) {
    await sql.read('SELECT Databases.name AS `name` FROM `Databases`, AccountDatabases WHERE Databases.id = AccountDatabases.idDB AND AccountDatabases.idAccount = ?', [ uuid2hex(account) ], {
      each: row => {
        var db = row.name
        callback(db)
      }
    })
  }

  async createDatabase (name, account) {
    const dbID = uuidv4()
    let [error] = await to(sql.write('INSERT INTO `Databases` SET ?', { id: uuid2hex(dbID), name }))

    if (error && error.message.includes('ER_DUP_ENTRY')) throw new Errors.DatabaseTaken(name)
    if (error) throw error

    await sql.write('INSERT INTO AccountDatabases SET ?', {
      idDB: uuid2hex(dbID),
      idAccount: uuid2hex(account),
      type: 1
    })
  }

  async cloneDatabase (identity, db, newDatabaseName, account) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)

    const dbID = await findDatabaseID(db)

    // Create new database.
    await this.createDatabase (newDatabaseName, account)
    const newDatabaseID = await findDatabaseID(newDatabaseName)

    // Obtain all namespaces in database to be cloned.
    let namespaces = {}
    let results = await sql.read('SELECT * FROM Namespaces WHERE db = ?', uuid2hex(dbID))
    for (let i = 0; i < results.length; i++) {
      let ns = results[i].name
      let domainID = hex2uuid(results[i].id)
      await this.createNamespace(ns, newDatabaseName, account)
      const newNamespaceID = await findNamespaceID(newDatabaseID, ns)
      namespaces[domainID] = { name: ns, oldID: domainID, newID: newNamespaceID }
    }

    // Clone all events.
    await sql.read(`SELECT * FROM Events WHERE db = ?`, uuid2hex(dbID), { each: async row => {
      if (namespaces[hex2uuid(row.ns)]) {
        row.db = uuid2hex(newDatabaseID)
        row.ns = uuid2hex(namespaces[hex2uuid(row.ns)].newID)
        let [error] = await to(sql.write('INSERT INTO Events SET ?', row))
      }
    }})

    // Clone all annotations.
    await sql.read('SELECT * FROM Annotations WHERE db = ?', uuid2hex(dbID), { each: async row => {
      if (namespaces[hex2uuid(row.ns)]) {
        row.db = uuid2hex(newDatabaseID)
        row.ns = uuid2hex(namespaces[hex2uuid(row.ns)].newID)
        let [error] = await to(sql.write('INSERT INTO Annotations SET ?', row))
      }
    }})
  }

  async destroyDatabase (identity, db, account) {
    if (!identity.is.owner({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('owner', db)
    const dbID = await findDatabaseID(db)
    await Promise.all([
      sql.write('DELETE FROM Events WHERE db = ?', [ uuid2hex(dbID) ]),
      sql.write('DELETE FROM Annotations WHERE db = ?', [ uuid2hex(dbID) ]),
      sql.write('DELETE FROM Namespaces WHERE db = ?', [ uuid2hex(dbID) ]),
      sql.write('DELETE FROM `Databases` WHERE ?', { id: uuid2hex(dbID) }),
      sql.write('DELETE FROM AccountDatabases WHERE ?', { idDB: uuid2hex(dbID) })
    ])
  }

  async renameDatabase (identity, db, newName, account) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    let results = await sql.write('UPDATE `Databases` SET `name` = ? WHERE id = ?', [ newName, uuid2hex(dbID) ])
    if (results && !results.affectedRows) throw new Errors.DatabaseNotFound(db)
  }

  async grantAccount (identity, db, role, email, accountID) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    const roleID = await findRoleID(role)
    const emailAccountID = await this.findAccountID (email)
    let [ error, results ] = await to(sql.write('INSERT INTO AccountDatabases SET ? ON DUPLICATE KEY UPDATE type = ?', [{
      idDB: uuid2hex(dbID),
      idAccount: uuid2hex(emailAccountID),
      type: roleID
    }, roleID]))
    if (error) throw error
  }

  async revokeAccount (identity, db, email, accountID) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    const emailAccountID = await this.findAccountID (email)
    let [ error, results ] = await to(sql.write('DELETE FROM AccountDatabases WHERE idDB = ? AND idAccount = ?', [ uuid2hex(dbID), uuid2hex(emailAccountID) ]))
  }

  // Namespaces

  async listNamespaces (identity, db, callback) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)
    await sql.read('SELECT Namespaces.name AS `name` FROM Namespaces, `Databases` WHERE Namespaces.db = Databases.id AND Databases.name = ? ORDER BY Namespaces.name ASC', [ db ], {
      each: async row => {
        var ns = row.name
        await callback(ns)
      }
    })
  }

  async createNamespace (identity, name, db, account) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)

    const dbID = await findDatabaseID(db)

    let [error, results] = await to(sql.write('INSERT INTO Namespaces SET ?', {
      db: uuid2hex(dbID),
      id: uuid2hex(uuidv4()),
      name
    }))

    if (error && error.code === 'ER_DUP_ENTRY') throw new Errors.NamespaceTaken(name)
    if (error) throw error
  }

  async destroyNamespace (identity, name, db, account) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, name)
    await Promise.all([
      sql.write('DELETE FROM Namespaces WHERE db = ? AND `name` = ?', [ uuid2hex(dbID), name ]),
      sql.write('DELETE FROM Events WHERE db = ? AND ns = ?', [ uuid2hex(dbID), uuid2hex(domainID) ]),
      sql.write('DELETE FROM Annotations WHERE db = ? AND ns = ?', [ uuid2hex(dbID), uuid2hex(domainID) ])
    ])
  }

  async truncateNamespace (identity, name, db, account) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, name)
    await Promise.all([
      sql.write('DELETE FROM Events WHERE db = ? AND ns = ?', [ uuid2hex(dbID), uuid2hex(domainID) ]),
      sql.write('DELETE FROM Annotations WHERE db = ? AND ns = ?', [ uuid2hex(dbID), uuid2hex(domainID) ])
    ])
  }

  async renameNamespace (identity, db, ns, name, account) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)
    const dbID = await findDatabaseID(db)
    let [error, results] = await to(sql.write('UPDATE Namespaces SET `name` = ? WHERE db = ? AND `name` = ?', [ name, uuid2hex(dbID), ns ]))
    if (!error && results && !results.affectedRows) throw new Errors.NamespaceNotFound(ns, db)
    if (error && error.code === 'ER_DUP_ENTRY') throw new Errors.NamespaceTaken(name)
    if (error) throw error
  }

  // Streams

  async listStreams (identity, db, ns, each) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)
    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)
    await sql.read('SELECT Events.stream AS stream, MIN(Events.ts) AS first, MAX(Events.ts) AS latest, COUNT(*) AS count, annotation FROM Events LEFT JOIN Annotations ON Events.db = Annotations.db AND Events.ns = Annotations.ns AND Events.stream = Annotations.stream WHERE Events.db = ? AND Events.ns = ? AND Events.stream IN (SELECT DISTINCT stream FROM Events WHERE db = ? AND ns = ? ORDER BY stream ASC) GROUP BY Events.db, Events.ns, Events.stream', [ uuid2hex(dbID), uuid2hex(domainID), uuid2hex(dbID), uuid2hex(domainID) ], {
      each: row => {
        let annotation = JSON.parse(row.annotation)
        let stream = { id: hex2uuid(row.stream), created: row.first, modified: row.latest, size: row.count, annotation }
        if (annotation && annotation.type) stream.type = annotation.type
        each(stream)
      }
    })
  }

  async destroyStream (identity, db, ns, streamID, accountID) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.write('DELETE FROM Events WHERE db = ? AND ns = ? AND stream = ?', [
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID)
    ])

    if (results && !results.affectedRows) throw new Errors.StreamNotFound(db, ns, streamID)
  }

  // annotations

  async readAnnotation (identity, db, ns, streamID, account) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.read('SELECT annotation FROM Annotations WHERE db = ? AND ns = ? AND stream = ?', [
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID)
    ])

    if (!results || !results[0]) throw new Errors.AnnotationNotFound(db, ns, streamID)

    const row = results[0]
    var annotation = JSON.parse(row.annotation)
    return annotation
  }

  async writeAnnotation (identity, db, ns, streamID, annotation, account) {
    if (!identity.is.member({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('member', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.write('UPDATE Annotations SET annotation = ? WHERE db = ? AND ns = ? AND stream = ?', [
      JSON.stringify(annotation),
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID)
    ])

    if (results && !results.affectedRows) {
      await sql.write('INSERT INTO Annotations SET ?', {
        db: uuid2hex(dbID),
        ns: uuid2hex(domainID),
        stream: uuid2hex(streamID),
        annotation: JSON.stringify(annotation)
      })
    }
  }

  async destroyAnnotation (identity, db, ns, streamID, account) {
    if (!identity.is.member({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('member', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.write('DELETE FROM Annotations WHERE db = ? AND ns = ? AND stream = ?', [
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID)
    ])

    if (results && !results.affectedRows) throw new Errors.AnnotationNotFound(db, ns, streamID)
  }

  // events

  async listEvents (identity, { db, ns, stream, types, from, to, after, until, limit, schema }, eachCallback, endCallback) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)

    let options = {}

    let domainSearch = false
    if (!stream) domainSearch = true

    let streamScope = true
    if (!stream) streamScope = false

    if (limit) options.limit = limit = Math.min(50, limit)

    const dbID = await findDatabaseID(db)
    let conditions = 'WHERE db = ?'
    let params = [ uuid2hex(dbID) ]
    options.dbID = uuid2hex(dbID)

    if (ns) {
      const domainID = await findNamespaceID(dbID, ns)
      conditions += ' AND ns = ?'
      params.push(uuid2hex(domainID))
      options.domainID = uuid2hex(domainID)
    }

    if (stream) {
      conditions += ' AND stream = ?'
      params.push(uuid2hex(stream))
      options.streamID = uuid2hex(stream)
    }

    if (from) {
      let dt = DateTime.fromISO(decodeURIComponent(from), { setZone: true })
      if (dt.isValid) {
        conditions += ' AND ts >= ?'
        params.push(dt.toSQL())
        options.from = dt.toSQL()
      }
      else {
        if (!stream) {
          let tokens = from.split('.')
          from = tokens.pop()
          stream = tokens.pop()
        }

        let results = await sql.read('SELECT ts FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [ uuid2hex(dbID), uuid2hex(domainID), uuid2hex(stream), uuid2hex(from) ])
        if (!results || !results[0] || !results[0].ts) throw new Errors.EventNotFound(db, ns, stream, from)

        conditions += ' AND ts >= ?'
        const ts = results[0].ts
        params.push(ts)
        options.from = ts
      }
    }

    if (after) {
      let dt = DateTime.fromISO(decodeURIComponent(after), { setZone: true })
      if (dt.isValid) {
        conditions += ' AND ts > ?'
        params.push(dt.toSQL())
        options.after = dt
      }
      else {
        if (!stream) {
          let tokens = after.split('.')
          after = tokens.pop()
          stream = tokens.pop()
        }

        let results = await sql.read('SELECT ts, meta FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [ uuid2hex(dbID), uuid2hex(domainID), uuid2hex(stream), uuid2hex(after) ])
        if (!results || !results[0] || !results[0].ts) throw new Errors.EventNotFound(db, ns, stream, after)

        conditions += ' AND ts > ?'
        const ts = results[0].ts
        params.push(ts)
        options.after = DateTime.fromISO(JSON.parse(results[0].meta).ts, { setZone: true })
      }
    }

    if (to) {
      let dt = DateTime.fromISO(decodeURIComponent(to), { setZone: true })
      if (dt.isValid) {
        conditions += ' AND ts <= ?'
        params.push(dt.toSQL())
        options.to = dt.toSQL()
      }
      else {
        if (!stream) {
          let tokens = to.split('.')
          to = tokens.pop()
          stream = tokens.pop()
        }

        let results = await sql.read('SELECT ts FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [ uuid2hex(dbID), uuid2hex(domainID), uuid2hex(stream), uuid2hex(to) ])
        if (!results || !results[0] || !results[0].ts) throw new Errors.EventNotFound(db, ns, stream, to)

        conditions += ' AND ts <= ?'
        const ts = results[0].ts
        params.push(ts)
        options.to = ts
      }
    }

    if (until && until !== 'caught-up') {
      let dt = DateTime.fromISO(decodeURIComponent(until), { setZone: true })
      if (dt.isValid) {
        conditions += ' AND ts < ?'
        params.push(dt.toSQL())
        options.until = dt.toSQL()
      }
      else {
        if (!stream) {
          let tokens = until.split('.')
          until = tokens.pop()
          stream = tokens.pop()
        }

        let results = await sql.read('SELECT ts FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [ uuid2hex(dbID), uuid2hex(domainID), uuid2hex(stream), uuid2hex(until) ])
        if (!results || !results[0] || !results[0].ts) throw new Errors.EventNotFound(db, ns, stream, until)

        conditions += ' AND ts < ?'
        const ts = results[0].ts
        params.push(ts)
        options.until = ts
      }
    }

    if (stream) streamScope = true

    if (types) {
/* Full text search disabled due to this bug: FTS query exceeds result cache limit
   https://bugs.mysql.com/bug.php?id=80296

      if (stream) {
        conditions += `AND (db, ns, stream) IN ( SELECT db, ns, stream FROM EventTypes WHERE MATCH(type) AGAINST ('`
      }
      else {
        conditions += `AND (db, ns) IN ( SELECT db, ns FROM EventTypes WHERE MATCH(type) AGAINST ('`
      }
      let list = Array.isArray(types) ? types : [types]
      for (let type of list) conditions += `"${type}" `
      conditions += `' IN BOOLEAN MODE) )`
*/

      // Build a query that doesn't use full text search.
      let list = Array.isArray(types) ? types : [types]
      conditions += ' AND (' + list.map(type => `type ${wildcards.toMysqlOperator(type)} ?`).join(' OR ') + ')'
      for (let type of list) {
        params.push(wildcards.toMysqlLike(type))
      }
    }

    let limitCondition = ''
    if (limit) {
      limitCondition = `LIMIT ${limit}`
    }

/*
Select statement for searching events in ns by type:

SELECT * FROM Events WHERE db = X'af9314269921411ea2363bdb346df125' AND ns = X'544eebef11004365b3d84ceb8755b75f' AND ts > '2019-04-03 05:25:20.779'
  AND (`db`, `ns`) IN (
    SELECT db, ns
    FROM EventTypes 
    WHERE MATCH(type) AGAINST ('appregistered' IN BOOLEAN MODE) 
  )
ORDER BY ts ASC
LIMIT 50

*/

    if (types && !options.after && !options.from && !options.to && (!options.until || options.until === 'caught-up')) {
      let rows = undefined
      if (stream) {
        rows = await sql.read(`SELECT * FROM Events WHERE db = ? AND ns = ? AND stream = ? ORDER BY ts ASC LIMIT 1`, [ options.dbID, options.domainID, options.streamID ])
      }
      else {
        rows = await sql.read(`SELECT * FROM Events WHERE db = ? AND ns = ? ORDER BY ts ASC LIMIT 1`, [ options.dbID, options.domainID ])
      }

      if (rows && rows[0]) {
        let row = rows[0]
        let event = { data: JSON.parse(row.data), meta: JSON.parse(row.meta) }
        options.after = DateTime.fromISO(event.meta.ts, { setZone: true }).minus(1)
      }
    }

    // Prepare empty result set.
    let results = {
      meta: {
        cursor: { db, ns, types, from, to, /*after,*/ until, limit, schema: 'jsonapi' }
      },
      links: {
        next: { types, from, to, after, until, limit, schema: 'jsonapi' }
      },
      data: []
    }

/*
    if (domainSearch && stream && after) {
      results.meta.cursor.after = `${stream}.${after}`
    }
*/
    if (!domainSearch) {
      results.meta.cursor.stream = stream
    }

    let last = undefined
    if (types && options.after && !options.from && !options.to && (!options.until || options.until === 'caught-up')) {
      // When filtering by type, run the query in a loop one day at a time.
      //let dtAfter = DateTime.fromSQL(after)
      let dtAfter = options.after
      let dtTo = dtAfter.plus({ minutes: 10 })

      let start = new Date()
      let duration = 0
      let count = 0
      while ((count < options.limit) && (duration < 1000 /* ms */)) {
        if (dtAfter >= DateTime.local()) {
          delete results.meta.cursor
          break
        }

        let dtLast = undefined
        let rows = await sql.read(`SELECT * FROM Events ${conditions} AND ts > '${dtAfter.toSQL()}' AND ts <= '${dtTo.toSQL()}' ORDER BY ts ASC ${limitCondition}`, params)
        if (rows && rows[0]) {
          for (let row of rows) {
            count = count + 1
            let event = { data: JSON.parse(row.data), meta: JSON.parse(row.meta) }
            last = streamScope ? event.meta.id : `${event.meta.stream}.${event.meta.id}`
            dtLast = DateTime.fromISO(event.meta.ts, { setZone: true })
            results.data.push(event)
            if (eachCallback) eachCallback(event)
            if (count >= options.limit) break
          }
        }

        if (dtLast) {
          dtAfter = dtLast
        }
        else {
          dtAfter = dtTo
        }

        dtTo = dtAfter.plus({ minutes: 10 })
        results.meta.cursor.after = dtAfter.toISO()
        results.links.next.after = dtAfter.toISO()
        duration = new Date() - start
      }
    }
    else {
      // When not filtering by type, run the query in one go.
      await sql.read(`SELECT * FROM Events ${conditions} ORDER BY ts ASC ${limitCondition}`, params, {
        each: row => {
          let event = { data: JSON.parse(row.data), meta: JSON.parse(row.meta) }
          results.data.push(event)
          last = domainSearch ? `${event.meta.stream}.${event.meta.id}` : event.meta.id
          results.meta.cursor.after = last
          results.links.next.after = last
          if (eachCallback) eachCallback(event)
        }
      })
    }

    if (results.meta.cursor) {
      Object.keys(results.meta.cursor).forEach(key => {
        if (results.meta.cursor[key] === undefined) {
          delete results.meta.cursor[key]
        }
      })
    }

    Object.keys(results.links.next).forEach(key => {
      if (results.links.next[key] === undefined) {
        delete results.links.next[key]
      }
    })

    if (endCallback) endCallback({ last })
    return results
  }

  async writeEvent (identity, params, accountID) {
    if (!identity.is.member({ db: params.db })) throw new Errors.ForbiddenOrDatabaseNotFound('member', params.db)

    params.ts = new Date()

    if (!params.id) params.id = uuidv4()

    params.meta = Object.assign({ tz: DateTime.local().zoneName }, params.meta, {
      id: params.id,
      stream: params.stream,
      ns: params.ns,
      db: params.db,
      ts: params.ts.toISOString()
    })

    params.data = params.data || {}

    const dbID = await findDatabaseID(params.db)
    const nsID = await findOrCreateNamespaceID(identity, params.db, dbID, params.ns)

    let [error] = await to(sql.write('INSERT INTO Events SET ?', {
      id: uuid2hex(params.id),
      ts: params.ts,
      db: uuid2hex(dbID),
      ns: uuid2hex(nsID),
      stream: uuid2hex(params.stream),
      meta: JSON.stringify(params.meta),
      data: JSON.stringify(params.data)
    }))

    if (error && error.code === 'ER_DUP_ENTRY') throw new Errors.DuplicateEvent(params.id)
    if (error) throw error

    const event = { data: params.data, meta: params.meta }
    this.emit('eventwritten', { account: accountID, event })

    return event
  }

  async readEvent (identity, db, ns, streamID, eventID, accountID) {
    if (!identity.is.reader({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('reader', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.read('SELECT * FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID),
      uuid2hex(eventID)
    ])

    if (!results || !results[0]) throw new Errors.EventNotFound(db, ns, streamID, eventID)

    const row = results[0]
    var event = { data: JSON.parse(row.data), meta: JSON.parse(row.meta) }
    return event
  }

  async destroyEvent (identity, db, ns, streamID, eventID, accountID) {
    if (!identity.is.admin({ db })) throw new Errors.ForbiddenOrDatabaseNotFound('admin', db)

    const dbID = await findDatabaseID(db)
    const domainID = await findNamespaceID(dbID, ns)

    let results = await sql.write('DELETE FROM Events WHERE db = ? AND ns = ? AND stream = ? AND id = ?', [
      uuid2hex(dbID),
      uuid2hex(domainID),
      uuid2hex(streamID),
      uuid2hex(eventID)
    ])

    if (results && !results.affectedRows) throw new Errors.EventNotFound(db, ns, streamID, eventID)
  }
}

module.exports = { Store, Errors }
