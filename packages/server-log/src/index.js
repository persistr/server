const fs = require('fs')
const { config } = require('@persistr/server-config')
const { DateTime } = require('luxon')
const path = require('path')
const util = require('util')

const prepare = (...args) => {
  const dt = DateTime.local().toObject()
  const date = `${dt.year}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')}`
  const time = `${String(dt.hour).padStart(2, '0')}:${String(dt.minute).padStart(2, '0')}:${String(dt.second).padStart(2, '0')}.${String(dt.millisecond).padStart(3, '0')}`
  const file = path.join(`${config.log.folder}`, `${date}.log`)
  const message = util.format.apply(null, args)
  return { dt, date, time, file, message }
}

const log = (level, ...args) => {
  const info = prepare.apply(null, args)
  fs.mkdirSync(path.dirname(info.file), { recursive: true })
  fs.appendFileSync(info.file, `${info.date}\t${info.time}\t${level}\t${info.message}\n`)
}

const install = () => {
  console.error = log.bind(null, 'ERROR')
  console.warn = log.bind(null, 'WARNING')
  console.info = log.bind(null, '')
  console.log = log.bind(null, '')

  const methods = ['log', 'info', 'warn', 'error']
  methods.forEach((methodName) => {
    const originalLoggingMethod = console[methodName]
    console[methodName] = (firstArgument, ...otherArguments) => {
      const originalPrepareStackTrace = Error.prepareStackTrace
      Error.prepareStackTrace = (_, stack) => stack
      const callee = new Error().stack[1]
      Error.prepareStackTrace = originalPrepareStackTrace
      const relativeFileName = path.relative(path.normalize(path.join(process.cwd(), '..', '..')), callee.getFileName())
      const prefix = `${relativeFileName}:${callee.getLineNumber()}:`
      const moduleName = callee.getModuleName ? callee.getModuleName() : undefined
      if (moduleName) prefix = moduleName + ':' + prefix
      if (typeof firstArgument === 'string') {
        originalLoggingMethod(prefix + '\t' + firstArgument, ...otherArguments)
      } else {
        originalLoggingMethod(prefix + '\t', firstArgument, ...otherArguments)
      }
    }
  })
}

module.exports = { log, install }
