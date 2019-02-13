const Client = require('ssb-client')
const { h, Value, Dict, computed, resolve } = require('mutant')
const { ipcRenderer } = require('electron')
const pull = require('pull-stream')

module.exports = function (config) {
  if (!config) throw new Error('view requires a config to know how to connect to server')
  // TODO maybe just give the view a connection?

  const state = {
    server: Value(),
    myId: Value(),
    connections: Dict({
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
    quiting: false
  }

  const App = h('App', [
    h('div', [
      'My ID: ',
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
                  clicked.set(false)
                  Follow(server)(peer.key)
                }
              },
              'follow'
            )
          ])
        })),
        h('div', 'connections.global'),
        h('ul', connections.global.map(peer => {
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
      h('button', { 'ev-click': closeApp }, 'Close App')
    ])
  ])
  document.body.appendChild(App)

  Client(config.keys, config, (err, server) => {
    if (err) return console.error(err)
    state.myId.set(server.id)
    state.server.set(server)

    function loop () {
      pollPeers()
      pollProgress()
      if (!state.quiting) setTimeout(loop, 1e3)
    }
    loop()
    streamHops()

    function pollPeers () {
      server.gossip.peers((err, data) => {
        if (err) return console.error(err)

        const locals = data.filter(d => d.source === 'local' && d.state === 'connected')
        state.connections.put('local', locals)

        const globals = data.filter(d => d.source !== 'local' && d.state === 'connected')
        state.connections.put('global', globals)
      })
    }
    function pollProgress () {
      server.status((err, data) => {
        if (err) return console.error(err)

        state.progress.indexes.current.set(data.progress.indexes.current)
        state.progress.indexes.target.set(data.progress.indexes.target)
      })
    }
    function streamHops () {
      pull(
        server.friends.hopStream({ live: true, old: true }),
        pull.drain(m => {
          const newState = Object.assign(resolve(state.hops), m)
          state.hops.set(newState)
        })
      )
    }

    ipcRenderer.on('server-closed', () => {
      console.log('client: RECEIVED << server-closed, closing client')
      server.close()
    })
  })

  function closeApp () {
    console.log('client: SENDING >> server-close')
    state.quiting = true
    ipcRenderer.send('server-close')
  }
}

function Follow (server) {
  return function (feedId, cb = console.log) {
    // TODO isFeed or a Schema
    const follow = {
      type: 'contact',
      contact: feedId,
      following: true
    }

    server.publish(follow, (err, msg) => {
      if (err) return cb(err)

      cb(null, msg)
    })
  }
}

function Progress (current, target) {
  if (isNaN(current) || isNaN(target)) return
  if (current <= 0 || target <= 0) return

  const proportion = current / target
  const totalMB = Math.floor(target / 1024 / 1024) // 1 step = 1 MB
  const total = totalMB
  const done = Math.floor(proportion * total)

  const DONE = '■'
  const TODO = '□'
  const WIDTH = 40

  var bar = []

  for (var i = 1; i <= total; i++) {
    if (i <= done) bar.push(DONE)
    else bar.push(TODO)

    if (i % WIDTH === 0) bar.push('\n')
    else bar.push(' ')
  }

  return h('div', [
    h('pre', bar),
    `${totalMB} MB of messages replicated (${Math.floor(proportion * 100)}% processed)`
  ])
}
