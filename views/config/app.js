const { h, resolve, when } = require('mutant')
const ConfigPicker = require('./com/config-picker')
const ConfigEditor = require('./com/config-editor')

function App (state) {
  return h('App', [
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
      h('button',
        {
          'disabled': when(state.error, true),
          'title': state.error,
          'ev-click': NextStep
        },
        'Launch App'
      )
    ])
  ])

  function NextStep () {
    if (resolve(state.error)) return
    state.quitting.set(true)
  }
}

App.style = `
  App {
    font-family: arial, sans-serif

    display: grid
    grid-template-columns: auto 774px auto
    grid-gap: 1rem
    justify-content: stretch

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
        span {
          font-family: monospace
          font-size: 16px
          padding: 3px 5px
          // border: 1px solid black
          // border-radius: 2px
        }
      }
    } 
    div.footer {
      grid-row: 3
      grid-column: 2
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
