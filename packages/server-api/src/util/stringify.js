const Stringify = require('streaming-json-stringify')
module.exports = async function(readable, writable) {
  return new Promise(async (resolve, reject) => {
    let count = 0
    let stringify = Stringify()
    stringify.on('end', function () { count++; if (count >= 2) resolve() })
    stringify.on('finish', function () { count++; if (count >= 2) resolve() })
    stringify.pipe(writable)
    readable.each(x => { stringify.write(x) })
      .then(() => stringify.end())
      .catch(error => reject(error))
  })
}
