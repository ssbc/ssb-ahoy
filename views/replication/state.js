const Client = require('ssb-client')
const { Value, Dict, resolve, watch } = require('mutant')
const { ipcRenderer } = require('electron')
const pull = require('pull-stream')
const Abortable = require('pull-abortable')

const getStatus = require('../../lib/get-status')
const log = require('../../lib/log').bind(null, 'ui')

const LOOP_PERIOD = 1e3

module.exports = function State (config) {
  const state = {
    server: Value(),
    myId: Value(config.keys.id),
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
      setTimeout(loop, LOOP_PERIOD)
    }
    loop()
    streamHops(server, state)

    watch(state.quitting, quitting => {
      if (!quitting) return

      server.close()
      log('SENDING  >> ahoy:step')
      ipcRenderer.send('ahoy:step')
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
