const Config = require('ssb-config/inject')
const { join } = require('path')
const merge = require('lodash.merge')

module.exports = function buildConfig (appname) {
  if (!appname || typeof appname !== 'string') throw new Error('ssb-ahoy#buildConfig requires valid appname')

  console.log('LOADING config')
  var config = Config(appname)

  config = addSockets(config)
  config = fixLocalhost(config)

  // TODO IMPORTANT!!! - move all of this functionality out and store this in the ~/.ssb/config
  // config = pubHopSettings(config)
  // config = torOnly(config)

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

// function pubHopSettings (config) {
//   const pubHopAll = 3
//   let pubHopConnections = settings.create().settings.sync.get('patchbay.pubHopConnections', pubHopAll)
//   if (pubHopConnections === pubHopAll) return config

//   return merge(
//     config,
//     {
//       friendPub: { hops: pubHopConnections },
//       gossip: {
//         friends: true,
//         global: false
//       }
//     })
// }

// function torOnly (config) {
//   if (settings.create().settings.sync.get('patchbay.torOnly', false)) {
//     config = merge(config, {
//       connections: {
//         outgoing: {
//           'onion': [{ 'transform': 'shs' }]
//         }
//       }
//     })

//     delete config.connections.outgoing.net
//     return config
//   } else { return config }
// }
