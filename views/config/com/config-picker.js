const { h, computed, when, resolve, Value } = require('mutant')
const Spinner = require('./spinner')

function ConfigPicker ({ appname, searching }) {
  const showAdd = Value(false)

  return h('ConfigPicker', [
    h('div.description', 'Pick an identity to launch with'),
    h('div.options', [
      computed([appname.selected, appname.options], (selected, options) => {
        return options.map(name => {
          return h('button', {
            'className': selected === name ? '-selected' : '',
            'ev-click': () => appname.selected.set(name)
          }, name === 'ssb' ? 'ssb (default)' : name)
        })
      }),
      h('div.add', [
        h('i.fa.fa-plus', { 'ev-click': toggleShowAdd }),
        h('input', {
          'className': when(showAdd, '', '-hidden'),
          'placeholder': 'add a new identity',
          'ev-input': ev => appname.new.set(ev.target.value.trim()),
          'value': appname.new
        })
      ]),
      h('div.helper', [
        computed([showAdd, searching, appname.new], (showAdd, searching, name) => {
          if (!showAdd || !name) return
          if (name.length < 3) return '...'
          if (searching) return

          return h('a', { href: '#', 'ev-click': addNew }, 'create this identity')
        })
      ])
    ])
  ])

  function toggleShowAdd (ev) {
    showAdd.set(!resolve(showAdd))
    var input = ev.target.parentElement.querySelector('input')
    input.focus()
  }

  function addNew () {
    const name = resolve(appname.new)
    if (appname.options.includes(name)) return

    appname.options.push(name)
    appname.selected.set(name)
    appname.new.set('')
  }
}

ConfigPicker.style = `
  ConfigPicker {
    div.description { margin-bottom: .5rem }
    div.options {
      display: flex
      justify-content: start

      --color: black
      // --color: hsla(529, 100%, 39%, 1)

      button {
        margin-right: .5rem
      }

      div.add {
        border: 1px solid black
        margin-right: .5rem

        display: grid
        grid-template-columns: auto auto
        justify-content: stretch
        align-content: stretch

        i.fa {
          cursor: pointer
          padding: .5rem

          display: grid
          justify-content: center
          align-content: center
        }
        input {
          border: none

          width: auto
          max-width: 7rem
          transition: max-width 0.3s ease-in

          -hidden { max-width: 0 }
        }
      }

      div.helper {
        display: grid
        align-content: center

        a { 
          color: black
          text-decoraction: underline
        }
      }
    }
  }
`
ConfigPicker.components = [
  Spinner
]

module.exports = ConfigPicker
