const { join } = require('path')
const getName = require('./get-name')

module.exports = function isSetUp (config, modulesDir, cb) {
  if (process.env.AHOY === 'true') return cb(null, !process.env.AHOY)

  const Server = require(join(modulesDir, 'ssb-server'))
  const server = Server(config)

  // TODO might want to extend this. See README#the-voyage-map
  getName(server)(server.id, (err, name) => {
    server.close(() => {
      if (err) return cb(err)
      cb(null, Boolean(name))
    })
  })
}
