const getName = require('./get-name')

module.exports = function isSetUp (server) {
  return function (cb) {
    if (process.env.AHOY === 'true') return cb(null, !process.env.AHOY)

    // TODO might want to extend this. See README#the-voyage-map
    getName(server)((err, name) => {
      if (err) return cb(err)

      cb(null, Boolean(name))
    })
  }
}
