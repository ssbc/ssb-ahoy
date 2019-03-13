const Config = require('ssb-config/inject')
const ahoy = require('./')

const config = Config('ahoy-test', {
  friends: { hops: 2 }
})

const plugins = ['ssb-private', 'ssb-backlinks', 'ssb-about', 'ssb-query', 'ssb-suggest']

ahoy(config, plugins)
