const { join } = require('path')

module.exports = function (modulesDir) {
  return [
    join(modulesDir, 'ssb-server/plugins/master'),
    join(modulesDir, 'ssb-server/plugins/local'),
    join(modulesDir, 'ssb-server/plugins/unix-socket'), // in case config includes sockets
    join(modulesDir, 'ssb-server/plugins/no-auth'), // in case config includes sockets
    join(modulesDir, 'ssb-server/plugins/logging'),

    // TODO check the plugins provided and use their versions if possible (rather than ssb-ahoy ones)
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt', // NOTE - could be trouble with initial sync?
    'ssb-friends',
    'ssb-invite'
  ]
}
