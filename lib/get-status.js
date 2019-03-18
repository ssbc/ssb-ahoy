const pickBy = require('lodash.pickby')

module.exports = function getStatus (server, cb) {
  server.status((err, data) => {
    if (err) return cb(err)

    const { progress, local: localPeers = {}, gossip = {} } = data
    const state = {
      progress,
      peers: {}
    }

    // gather all local connected (connected / not connected)
    const local = pickBy(gossip, peer => peer.source === 'local')
    Object.keys(localPeers).forEach(feedId => {
      if (local[feedId]) return
      local[feedId] = Object.assign({ state: 'not connected' }, local[feedId])
    })
    state.peers.local = toPeerArray(local)

    // gather all global connections
    const global = pickBy(gossip, peer => peer.source !== 'local' && peer.state === 'connected')
    state.peers.global = toPeerArray(global)

    cb(null, state)
  })
}

function toPeerArray (obj) {
  return Object.keys(obj).map(key => {
    return Object.assign({ key: key }, obj[key])
  })
}
