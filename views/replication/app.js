const { h, Value, computed } = require('mutant')
const Progress = require('progress-hex')

const Follow = require('../../lib/follow')

function App (state) {
  const app = h('App', [
    h('h1', 'Replication'),

    h('section.description', [
      h('p', [
        computed(state.myId, id => {
          if (!id) return
          return [
            'Welcome ',
            h('pre', id),
            ' (the unique public key for your device). '
          ]
        }),
        `To connect with friends you need to tell your computer which peers to follow. This will lead to things they've said being replicated (copied) to your computer. `,
        h('span.sidenote', '(Actually it will mean you copy things that peer has said, and things their friends have said).')
      ]),
      h('p', 'Choose some peers from below to follow, and watch the replication happening on the right. Your computer will also be indexing things it\'s received to build up meaning from the many different threads.')
    ]),

    h('section.peers', [
      h('h2', 'Local Peers (WiFi/LAN)'),
      computed([state.server, state.connections, state.hops], (server, connections, hops) => {
        if (!server) return 'Loading...'

        return [
          h('ul', connections.local.map(peer => {
            return Peer({
              peer,
              isFollowing: hops[peer.key] === 1,
              server
            })
          }))
          // NOTE there should be no global connections in this phase
          // h('ul', connections.global.map(peer => {
          //   ...
          // }))
        ]
      })
    ]),

    h('section.progress', computed([state.database.size, state.database.indexed], (size, indexed) => {
      return [
        h('div.size', `${size}MB replicated`),
        h('div.indexed', `${indexed}MB indexed`),
        h('div.graph', Progress({ n: size, progress: indexed })),
        indexed === size
          ? h('button -primary', { 'ev-click': NextStep, title: 'Launch' }, 'Launch!')
          : h('button', { disabled: true, title: 'Launch. WARNING: indexing is not yet complete, please wait' }, 'Launch!')
      ]
    }))
  ])

  return app

  function NextStep () {
    state.quitting.set(true)
  }
}

function Peer ({ peer, isFollowing, server }) {
  return h('li', [
    h('pre', peer.key),
    FollowButton({ peer, isFollowing, server }),
    ConnectButton({ peer, isFollowing, server })
  ])
}

function FollowButton ({ peer, isFollowing, server }) {
  if (isFollowing) {
    return h('button.Follow.-following', { disabled: true }, 'following')
  }

  const clicked = Value(false)
  return h('button.Follow',
    {
      disabled: clicked,
      'ev-click': () => {
        clicked.set(true)
        Follow(server)(peer.key)
      }
    },
    'follow'
  )
}

function ConnectButton ({ peer, isFollowing, server }) {
  if (!isFollowing && !peer.isConnected) return

  if (peer.isConnected) {
    return h('button.Connect.-connected', { disabled: true }, [
      'connected'
    ])
  }

  const clicked = Value(false)
  return h('button.Connect',
    {
      'disabled': clicked,
      'ev-click': () => {
        clicked.set(true)
        // const address = peer.address
        const address = [
          'net',
          peer.address.host.replace(/:/g, '!:'),
          peer.address.port + '~shs',
          peer.address.key.replace('@', '').replace(/=.*$/, '=')
        ].join(':')
        // console.log(address)
        server.gossip.connect(address, console.log)
      }
    },
    'connect'
  )
}

App.style = `
  App {
    font-family: arial, sans-serif

    display: grid
    grid-template-columns: minmax(400px, 6fr) 4fr
    grid-template-rows:  auto auto 1fr

    grid-gap: 1rem
    align-items: start

    min-height: 80vh
    max-width: 1200px
    padding: 0 2rem
    margin: 2rem auto

    h1 {
      grid-column: 1 / 2

      margin: 0
    }
    section.description {
      grid-column: 1 / 2

      (pre) {
        display: inline-block
        margin: 0
      }
    }

    section.peers {
      grid-column: 1 / 2
    }

    section.progress {
      grid-column: 2 / 3
      grid-row: 2 / 4
      align-self: stretch

      display: grid
      grid-template-rows: auto auto 1fr auto
      grid-gap: 1px

      div.size, div.indexed {
       text-align: end 
      }
      div.indexed {
        font-size: .8rem
      }

      div.graph {}

      button { align-self: end }
    }
  }

  p { margin-top: 0 }

  button {
    --color: black

    font-size: 1rem
    letter-spacing: 1px
    min-width: 8rem
    color: var(---color)
    background: none
    padding: .3rem .5rem
    border: 1px solid var(--color)
    outline: none

    cursor: pointer

    -selected {
      background: var(--color)
      color: white

      cursor: initial
    }

    :hover {
      background: var(--color)
      color: #fff
    }
  }

  button[disabled] {
    border: 1px solid rgba(0,0,0,0)
    :hover {

    color: initial
    background: none
    cursor: initial
  }

  input { outline: none }
  textarea { outline: none }
`

module.exports = App
