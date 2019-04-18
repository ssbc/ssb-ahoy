const pickBy = require('lodash.pickby')

const MB = 1024 * 1024

module.exports = function getStatus (server, cb) {
  server.status((err, data) => {
    if (err) return cb(err)

    const {
      progress: {
        indexes: { current, target }
      },
      local: localPeers = {},
      gossip = {}
    } = data

    const state = {
      database: {
        size: Math.max(Math.floor(target / MB), 0),
        indexed: Math.max(Math.floor(current / MB), 0)
      },
      connections: {}
    }

    // gather all local connected (connected / not connected)
    const local = pickBy(gossip, peer => peer.source === 'local')
    Object.keys(localPeers).forEach(feedId => {
      if (local[feedId]) return
      local[feedId] = Object.assign({ state: 'not connected' }, local[feedId])
    })
    state.connections.local = toPeerArray(local)

    // gather all global connections
    const global = pickBy(gossip, peer => peer.source !== 'local' && peer.state === 'connected')
    state.connections.global = toPeerArray(global)

    cb(null, state)
  })
}

function toPeerArray (obj) {
  return Object.keys(obj).map(key => {
    return Object.assign({ key: key }, obj[key])
  })
}
