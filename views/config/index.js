const { h, computed, when, throttle } = require('mutant')

const JSON5 = require('json5')

// polyfills
require('setimmediate')

const State = require('./state')

module.exports = function (config) {
  // no config expected in this step

  const state = State(config)

  const App = h('App', [
    h('div', [
      h('img', { src: './bandana.jpg' })
    ]),
    computed([state.appname.selected, state.appname.options], (appname, appnames) => {
      return appnames.map(name => {
        return h('button', {
          // 'class': appname === name ? '-selected' : '',
          'style': appname === name ? { background: 'fuchsia' } : {},
          'ev-click': () => state.appname.selected.set(name)
        }, name === 'ssb' ? 'ssb (default)' : name)
      })
    }),
    h('div.create', [
      h('input', {
        'placeholder': 'find or create a new identity',
        'ev-input': ev => state.appname.new.set(ev.target.value.trim()),
        'value': state.appname.new
      }),
      when(throttle(state.searching, 500), h('span', ' searching...')),
      when(throttle(state.loading, 500), h('span', ' loading...')),
      when(throttle(state.saving, 500), h('span', ' saving...'))
    ]),
    h('textarea', {
      'value': computed(state.config.current, c => JSON5.stringify(c, null, 2)),
      'ev-input': (ev) => {
        try {
          state.config.next.set(JSON5.parse(ev.target.value))
        } catch (err) {
          console.error(err.message)
          // err.lineNumber err.columnNumber
        }
      }
    }),
    h('button', { 'ev-click': NextStep }, 'Next Step')
  ])

  document.body.appendChild(App)

  function NextStep () {
    state.quitting.set(true)
  }
}
