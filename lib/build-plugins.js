const { join } = require('path')

module.exports = function buildPlugins ({ plugins, appDir }) {
  const corePlugins = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/local',
    'ssb-server/plugins/unix-socket', // in case config includes sockets
    'ssb-server/plugins/no-auth' // in case config includes sockets
  ]

  const replicationPlugins = [
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt', // NOTE may be broken ? (sometimes stalls out replicating)
    'ssb-friends' // NOTE makes replication calls at the moment
    // 'ssb-invite')) // no pub invites at this step currently!
  ]

  const _plugins = [
    ...corePlugins.map(makeElectronFriendly),
    ...replicationPlugins
  ]

  plugins.forEach(plugin => {
    if (corePlugins.includes(plugin)) return
    if (replicationPlugins.includes(plugin)) return

    _plugins.push(makeElectronFriendly(plugin))
  })

  return _plugins

  function makeElectronFriendly (plugin) {
    join('../..', appDir, 'node_modules', plugin)
  }
  // NOTE this is setting relative path _from the position of electron/process/server.js
  // to the plugin in the host app ):
}

