const join = require('./lib/join')

module.exports = function (appDir) {
  const core = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/local',
    'ssb-server/plugins/unix-socket', // in case config includes sockets
    'ssb-server/plugins/no-auth', // in case config includes sockets
    'ssb-server/plugins/logging'
  ]

  return [
    ...core.map(plugin => join('../..', appDir, 'node_modules', plugin)),

    // TODO check the plugins provided and use their versions if possible (rather than ssb-ahoy ones)
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt', // NOTE - could be trouble with initial sync?
    'ssb-friends',
    'ssb-invite'
  ]
}
