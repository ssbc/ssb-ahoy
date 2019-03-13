const getName = require('./get-name')

module.exports = function isSetUp (server) {
  return function (cb) {
    getName(server)((err, name) => {
      if (err) return cb(err)

      cb(null, Boolean(name))
    })
  }
}
