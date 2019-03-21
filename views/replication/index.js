const Client = require('ssb-client')
const { h, Value, Dict, computed, resolve, watch } = require('mutant')
const { ipcRenderer } = require('electron')
const pull = require('pull-stream')
const Abortable = require('pull-abortable')
const Progress = require('progress-hex')

// polyfills
require('setimmediate')

const getStatus = require('../../lib/get-status')
const log = require('../../lib/log')
const Follow = require('../../lib/follow')

module.exports = function (config) {
  if (!config) throw new Error('view requires a config to know how to connect to server')

  const state = State(config)

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
        h('div', 'connections.web'),
        h('ul', connections.global.map(peer => {
          return h('li', [
            h('pre', peer.key),
            ' ',
            peer.state
          ])
        }))
      ])
    }),
    h('div', [
      h('h2', 'Replication progress: '),
      computed([state.database.size, state.database.indexed], (size, indexed) => {
        return Progress({ n: size, progress: 0 })
      })
    ]),
    h('div', [
      h('p', `
        We're focusing on getting all the data from your peer as quickly as possible.
        After this step you'll be all set up to continute without any internet or wifi.
        Once the progress seems to be complete (graph not growing), push NEXT
      `),
      h('button', { 'ev-click': NextStep }, 'NEXT!')
    ])
  ])

  document.body.appendChild(App)

  function NextStep () {
    state.quitting.set(true)
    resolve(state.server).close(() => {
      log('(ui) SENDING  >> ahoy:step')
      ipcRenderer.send('ahoy:step')
    })
  }
}

function State (config) {
  const state = {
    server: Value(),
    myId: Value(),
    connections: Dict({
      local: [],
      global: []
    }),
    hops: Value({}),
    database: {
      size: Value(0),
      indexed: Value(0)
    },
    quitting: Value(false)
  }

  Client(config.keys, config, (err, server) => {
    if (err) return console.error(err)

    state.server.set(server)
    state.myId.set(server.id)

    function loop () {
      if (resolve(state.quitting)) return

      getStatus(server, (err, data) => {
        if (err) return console.error(err)

        const {
          database: { size, indexed },
          connections: { local, global }
        } = data

        state.database.size.set(size)
        state.database.indexed.set(indexed)
        state.connections.put('local', local)
        state.connections.put('global', global)
      })
      setTimeout(loop, 1e3)
    }
    loop()
    streamHops(server, state)

    watch(state.quitting, quitting => {
      if (quitting) server.close()
    })
  })

  return state
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
