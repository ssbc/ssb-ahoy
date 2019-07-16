const { h, resolve, computed } = require('mutant')
const { ipcRenderer } = require('electron')
const ConfigPicker = require('./com/config-picker')
const ConfigEditor = require('./com/config-editor')

function App (state, config) {
  return h('App',
    {
      hooks: [
        function (el) {
          document.body.addEventListener('keyup', ev => {
            if (ev.keyCode !== 13) return
            if (ev.target.tagName !== 'BODY') return

            Launch()
          })
        }
      ]
    },
    [
      h('div.banner'),
      h('div.main', [
        ConfigPicker(state),
        h('div.feedId', [
          'id : ',
          h('span', state.feedId)
        ]),
        ConfigEditor(state)
      ]),
      h('div.footer', [
        h('div.config',
          {
            'title': 'Edit config',
            'ev-click': () => state.config.isEditing.set(!state.config.isEditing())
          },
          [
            h('i.fa.fa-cog'),
            ' ',
            h('span', 'edit config')
          ]
        ),
        h('button.initial-sync',
          {
            'ev-click': NextStep,
            title: 'Initial Sync is for when you are setting up your account for the first time. It helps you get up to speed smoothly'
          },
          'Initial Sync'
        ),
        computed(state.error, error => {
          const opts = error
            ? { disabled: true, title: error }
            : { 'ev-click': Launch, title: 'Launch app (⏎)' }

          return h('button.launch-app', opts, 'Launch App')
        })
      ])
    ]
  )

  function NextStep () {
    if (resolve(state.error)) return
    state.quitting.set(true)
  }

  function Launch () {
    if (resolve(state.error)) return
    ipcRenderer.send('ahoy:prepare-to-launch')
    state.quitting.set(true)
  }
}

// uses mcss: github.com/mmckegg/micro-css
App.style = `
  App {
    font-family: arial, sans-serif

    display: grid
    grid-template-columns: auto 774px auto
    grid-template-rows: auto minmax(420px, 1fr) auto

    grid-gap: 1rem
    justify-content: stretch
    align-items: start

    div.banner {
      grid-row: 1
      grid-column: 1 / 4
      background: url('./bandana.jpg') center no-repeat, #1e0060
      height: 300px
    }

    div.main {
      grid-row: 2
      grid-column: 2


      display: grid
      grid-gap: 1rem

      div.ConfigPicker {}

      div.feedId {
        padding-left: .5rem

        span {
          font-family: monospace
          font-size: 18px
          padding: 3px 5px
          // border: 1px solid black
          // border-radius: 2px
        }
      }
    } 
    div.footer {
      grid-row: 3
      grid-column: 2

      display: grid
      grid-template-columns: 1fr auto auto

      justify-content: start
      align-items: baseline

      grid-gap: 1rem

      div.config {
        padding-left: .5rem
        cursor: pointer
        :hover {
          span { text-decoration: underline}
        }
      }

      button.initial-sync {
        border: 1px solid rgba(0,0,0,0)
        :hover { border: 1px solid rgba(0,0,0,1) }
      }
    }
  }
  
  button {
    --color: black

    font-size: 1rem
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
  }
  button[disabled] { cursor: not-allowed }
  input { outline: none }
  textarea { outline: none }
`
App.components = [
  ConfigPicker,
  ConfigEditor
]

module.exports = App
