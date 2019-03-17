const { join } = require('path')

module.exports = function (modulesDir) {
  return [
    join(modulesDir, 'ssb-server/plugins/master'),
    join(modulesDir, 'ssb-server/plugins/local'),
    join(modulesDir, 'ssb-server/plugins/unix-socket'), // in case config includes sockets
    join(modulesDir, 'ssb-server/plugins/no-auth'), // in case config includes sockets
    join(modulesDir, 'ssb-server/plugins/logging'),

    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt',
    'ssb-friends',
    'ssb-invite'
  ]
}
