const join = require('./lib/join')

module.exports = function (appDir) {
  // NOTE! this file isn't currently used, hasn't been tried recently :)

  const core = [
    'master',
    // 'local',
    'unix-socket', // in case config includes sockets
    'no-auth', // in case config includes sockets
    'logging'
  ]

  return [
    ...core.map(makeElectronFriendly),

    // TODO check the plugins provided and use their versions if possible (rather than ssb-ahoy ones)
    'ssb-conn',
    'ssb-replicate',
    'ssb-ebt',
    'ssb-friends'
    // 'ssb-invite'
  ]

  function makeElectronFriendly (plugin) {
    return join('../..', appDir, 'node_modules', plugin)
  }
  // NOTE this is setting relative path _from the position of electron/process/server.js
  // to the plugin in the host app ):
}
