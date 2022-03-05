const Config = require('ssb-config/inject')
const merge = require('lodash.merge')
const { join } = require('path')

module.exports = function buildConfig (appname, opts = {}) {
  if (!appname || typeof appname !== 'string') throw new Error('ssb-ahoy#buildConfig requires valid appname')

  const {
    socket = false
  } = opts

  // NOTE opinionated defaults. Overrideable by editing config
  const defaults = {
    friends: { hops: 2 }
  }
  let config = Config(appname, defaults)

  if (socket) config = addSockets(config)
  config = fixLocalhost(config)
  return config
}

function addSockets (config) {
  if (process.platform === 'win32') return config

  const pubkey = config.keys.id.slice(1).replace(`.${config.keys.curve}`, '')
  return merge(
    config,
    {
      connections: {
        incoming: { unix: [{ scope: 'device', transform: 'noauth', server: true }] }
      },
      remote: `unix:${join(config.path, 'socket')}:~noauth:${pubkey}` // overwrites
    }
  )
}

function fixLocalhost (config) {
  if (process.platform !== 'win32') return config

  // without this host defaults to :: which doesn't work on windows 10
  // NOTE this over-rides anyone trying to set the host manually in windows
  // TODO move fixes upstream into ssb-config ...
  config.connections.incoming.net[0].host = '127.0.0.1'
  config.connections.incoming.ws[0].host = '127.0.0.1'
  config.host = '127.0.0.1'
  return config
}
