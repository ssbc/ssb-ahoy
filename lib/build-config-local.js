const merge = require('lodash.merge')
const get = require('lodash.get')

module.exports = function ConfigLocal (config) {
  const _config = merge({}, config)

  // NOTE - I don't know which of these config changes below are blocking the local
  // connections successfully ... couldn't find where they're all used in stack

  _config.gossip = Object.assign({}, _config.gossip || {}, {
    local: true,
    friends: false,
    seed: false,
    global: false
  })

  // TODO if we had config schemas this would be less of a mess
  const outgoing = get(_config, 'connections.outgoing.net')
  if (outgoing && Array.isArray(outgoing)) {
    _config.connections.outgoing.net = outgoing.map(conf => {
      return Object.assign(conf, { scope: ['device', 'local'] })
    })
  }
  const incoming = get(_config, 'connections.incoming.net')
  if (incoming && Array.isArray(incoming)) {
    _config.connections.incoming.net = outgoing.map(conf => {
      return Object.assign(conf, { scope: ['device', 'local'] })
    })
  }

  return _config
}
