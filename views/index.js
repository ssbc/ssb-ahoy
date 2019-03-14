const Client = require('ssb-client')
const { h, Value, Dict, computed, resolve, watch } = require('mutant')
const { ipcRenderer } = require('electron')
const pull = require('pull-stream')
const Abortable = require('pull-abortable')
const pickBy = require('lodash.pickby')

// polyfills
require('setimmediate')

const Progress = require('./com/progress')
const Follow = require('../lib/follow')
const log = require('../lib/log')

module.exports = function (config) {
  if (!config) throw new Error('view requires a config to know how to connect to server')
  // TODO maybe just give the view a connection?

  const state = {
    server: Value(),
    myId: Value(),
    peers: Dict({
      local: [],
      global: []
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

      pollStatus(server, state)
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
    computed([state.server, state.peers, state.hops], (server, peers, hops) => {
      if (!server) return 'Loading...'

      return h('div', [
        h('div', 'peers.local'),
        h('ul', peers.local.map(peer => {
          if (hops[peer.key] === 1) {
            return h('li', [
              h('pre', peer.key),
              ' Following ',
              peer.state
            ])
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
            ),
            ' ',
            peer.state
          ])
        })),
        h('div', 'peers.web'),
        h('ul', peers.global.map(peer => {
          return h('li', [
            h('pre', peer.key),
            ' ',
            peer.state
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
    log('(ui) SENDING  >> server-close')
    state.quitting.set(true)
    resolve(state.server).close(noop)
    ipcRenderer.send('server-close')
  }
}

// helpers
// TODO extract

// function pollConnections (server, state) {
//   server.gossip.peers((err, data) => {
//     if (err) return console.error(err)

//     const local = data.filter(d => d.source === 'local' && d.state === 'connected')
//     state.peers.put('local', local)

//     const global = data.filter(d => d.source !== 'local' && d.state === 'connected')
//     state.peers.put('global', global)
//   })
// }

function pollStatus (server, state) {
  server.status((err, data) => {
    if (err) return console.error(err)
    const { progress, local: localPeers = {}, gossip = {} } = data

    state.progress.indexes.current.set(progress.indexes.current)
    state.progress.indexes.target.set(progress.indexes.target)

    // gather all local connected (connected / not connected)
    const local = pickBy(gossip, peer => peer.source === 'local')
    Object.keys(localPeers).forEach(feedId => {
      if (local[feedId]) return
      local[feedId] = Object.assign({ state: 'not connected' }, local[feedId])
    })
    state.peers.put('local', toPeerArray(local))

    // gather all global connections
    const global = pickBy(gossip, peer => peer.source !== 'local' && peer.state === 'connected')
    state.peers.put('global', toPeerArray(global))
  })
}

function toPeerArray (obj) {
  return Object.keys(obj).map(key => {
    return Object.assign({ key: key }, obj[key])
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
