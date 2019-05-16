const join = require('./join')

module.exports = function buildPlugins ({ plugins, appDir }) {
  const corePlugins = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/local',
    'ssb-server/plugins/unix-socket', // in case config includes sockets
    'ssb-server/plugins/no-auth' // in case config includes sockets
  ]

  const replicationPlugins = [
    // NOTE - build-plugins is currently only used in last steps : indexing + launching final app
    //        safe to assume final app has replication plugins installed
    // 'ssb-legacy-conn',
    // 'ssb-replicate',
    // 'ssb-ebt', // NOTE may be broken ? (sometimes stalls out replicating)
    // 'ssb-friends' // NOTE makes replication calls at the moment
    // // 'ssb-invite')) // no pub invites at this step currently!
  ]

  const _plugins = [
    ...corePlugins.map(makeElectronFriendly),
    ...replicationPlugins
  ]

  // TODO actually prefer the ssb-gossip etc provided by remote peer and drop local one.
  plugins.forEach(plugin => {
    if (corePlugins.includes(plugin)) return
    if (replicationPlugins.includes(plugin)) return

    _plugins.push(makeElectronFriendly(plugin))
  })

  return _plugins

  function makeElectronFriendly (plugin) {
    return join('../..', appDir, 'node_modules', plugin)
  }
  // NOTE this is setting relative path _from the position of electron/process/server.js
  // to the plugin in the host app ):
}
