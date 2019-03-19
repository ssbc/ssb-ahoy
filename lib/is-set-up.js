const join = require('./join')
const getName = require('./get-name')

module.exports = function isSetUp (config, appDir, cb) {
  if (process.env.AHOY === 'true') return cb(null, !process.env.AHOY)

  const Server = require(join('..', appDir, 'node_modules/ssb-server'))
  const server = Server(config)

  // TODO might want to extend this. See README#the-voyage-map
  getName(server)(server.id, (err, name) => {
    server.close(() => {
      if (err) return cb(err)
      cb(null, Boolean(name))
    })
  })
}
