const Client = require('ssb-client')
const { h, Value, Dict, computed, resolve, watch } = require('mutant')
const { ipcRenderer } = require('electron')
const pull = require('pull-stream')
const Abortable = require('pull-abortable')

// polyfills
require('setimmediate')

const Progress = require('./com/progress')
const Follow = require('../lib/follow')

module.exports = function (config) {
  if (!config) throw new Error('view requires a config to know how to connect to server')
  // TODO maybe just give the view a connection?

  const state = {
    server: Value(),
    myId: Value(),
    connections: Dict({
      local: [],
      web: []
    }),
    hops: Value({}),
    progress: {
      indexes: {
        current: Value('?'),
        target: Value('?')
      }
    },
    quitting: Value(false)
  }

  Client(config.keys, config, (err, server) => {
    if (err) return console.error(err)

    state.myId.set(server.id)
    state.server.set(server)

    function loop () {
      if (resolve(state.quitting)) return

      pollConnections(server, state)
      pollProgress(server, state)
      setTimeout(loop, 1e3)
    }
    loop()
    streamHops(server, state)
  })

  const App = h('App', [
    h('div', [
      'My FeedId: ',
      h('pre', state.myId)
    ]),
    computed([state.server, state.connections, state.hops], (server, connections, hops) => {
      if (!server) return 'Loading...'

      return h('div', [
        h('div', 'connections.local'),
        h('ul', connections.local.map(peer => {
          if (hops[peer.key] === 1) {
            return h('li', [ h('pre', peer.key), ' Following' ])
          }

          const clicked = Value(false)
          return h('li', [
            h('pre', peer.key),
            h('button',
              {
                disabled: clicked,
                'ev-click': () => {
                  clicked.set(true)
                  Follow(server)(peer.key)
                }
              },
              'follow'
            )
          ])
        })),
        h('div', 'connections.web'),
        h('ul', connections.web.map(peer => {
          return h('li', [
            h('pre', peer.key)
          ])
        }))
      ])
    }),
    h('div', [
      'index progress: ',
      computed([state.progress.indexes.current, state.progress.indexes.target], Progress)
    ]),
    h('div', [
      h('button', { 'ev-click': closeApp }, 'LAUNCH!')
    ])
  ])

  document.body.appendChild(App)

  function closeApp () {
    console.log('ui: SENDING >> server-close')
    state.quitting.set(true)
    resolve(state.server).close(noop)
    ipcRenderer.send('server-close')
  }
}

// helpers

function pollConnections (server, state) {
  server.gossip.peers((err, data) => {
    if (err) return console.error(err)

    const local = data.filter(d => d.source === 'local' && d.state === 'connected')
    state.connections.put('local', local)

    const web = data.filter(d => d.source !== 'local' && d.state === 'connected')
    state.connections.put('web', web)
  })
}

function pollProgress (server, state) {
  server.status((err, data) => {
    if (err) return console.error(err)

    state.progress.indexes.current.set(data.progress.indexes.current)
    state.progress.indexes.target.set(data.progress.indexes.target)
  })
}

function streamHops (server, state) {
  const through = Abortable()

  watch(state.quitting, q => {
    if (q) through.abort()
  })

  pull(
    server.friends.hopStream({ live: true, old: true }),
    through,
    pull.drain(m => {
      const newState = Object.assign(resolve(state.hops), m)
      state.hops.set(newState)
    })
  )
}

function noop () {}
