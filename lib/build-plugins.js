const { join } = require('path')

module.exports = function buildPlugins ({ plugins, modulesDir }) {
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
    ...corePlugins.map(plugin => join(modulesDir, plugin)),
    ...replicationPlugins
  ]

  plugins.forEach(plugin => {
    if (corePlugins.includes(plugin)) return
    if (replicationPlugins.includes(plugin)) return

    _plugins.push(join(modulesDir, plugin))
  })

  return _plugins
}
