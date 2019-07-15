const { h, computed, when, throttle } = require('mutant')
const JSON5 = require('json5')
const Spinner = require('./spinner')

const placeholder = `(optional)
e.g.
{
  friends: {
    hops: 2
  }
}
`
function ConfigEditor ({ config, loading, saving, error }) {
  return h('ConfigEditor', [
    h('textarea', {
      'className': when(config.isEditing, '', '-hidden'),
      'placeholder': placeholder,
      'value': computed(config.current, c => JSON5.stringify(c, null, 2)),
      'ev-input': (ev) => setConfigNext(ev.target.value)
    }),
    h('div.status', [
      // when(throttle(loading, 300), Spinner('loading...')),
      when(throttle(saving, 300), Spinner('saving...'))
    ])
  ])

  function setConfigNext (string) {
    if (string === '') return config.next.set({})

    try {
      config.next.set(JSON5.parse(string))
      error.set()
    } catch (err) {
      const msg = err.message
        .replace('JSON5', `Error, line ${err.lineNumber}`)
        .replace(/at \d+:\d+$/, '')
      error.set(msg)
    }
  }
}

ConfigEditor.style = `
  ConfigEditor {
    display: grid
    grid-gap: .5rem

    label {
      cursor: pointer
      :hover {
        span { text-decoration: underline }
      }
    }

    textarea {
      min-height: 330px


      font-size: 16px
      font-family: monospace

      padding: 8px
      border: 1px solid black

      transition: min-height .1s ease-in, border-color .6s ease-in

      -hidden {
        height: 0
        min-height: 0
        padding: 0
        border: 1px solid white
        transition: min-height .1s ease-in, border-color .1s ease-in
      }
    }

    div.status {
      height: 1rem
    }
  }
`
ConfigEditor.components = [
  Spinner
]

module.exports = ConfigEditor
