const { h, Value, computed, resolve, watch } = require('mutant')
const { ipcRenderer } = require('electron')
const Config = require('ssb-config/inject')
const fs = require('fs')
const { join } = require('path')

// polyfills
require('setimmediate')

const log = require('../../lib/log')

module.exports = function (config) {
  // if (!config) throw new Error('view requires a config to know how to connect to server')

  const state = State(config)
  loadConfig()

  const App = h('App', [
    h('input', {
      'value': state.appname,
      'ev-change': ev => state.appname.set(ev.target.value)
    }),
    h('button', { 'ev-click': loadConfig }, 'load'),
    h('textarea', { value: computed(state.customConfig, c => JSON.stringify(c, null, 2)) }), // TODO make this pretty printed

    h('button', { 'ev-click': NextStep }, 'Next Step')
  ])

  document.body.appendChild(App)

  function loadConfig () {
    // NOTE - this might create a directoy and a key at the moment D:
    const config = Config(resolve(state.appname))

    fs.readFile(join(config.path, 'config'), 'utf8', (err, str) => {
      if (err) {
        console.log('nope, did not exist', err)
        state.customConfig.set('{}')
      } else {
        // TODO make this safer
        state.customConfig.set(JSON.parse(str))
      }
    })
  }

  function NextStep () {
    state.quitting.set(true)
  }
}

function State (config) {
  var appname = (config && config.appname) ||
    process.env.ssb_appname ||
    'ssb'
  const state = {
    appname: Value(appname),
    customConfig: Value(),
    customConfigNext: Value(),
    quitting: Value(false)
  }

  watch(state.quitting, quitting => {
    if (!quitting) return

    ipcRenderer.send('ahoy:appname', resolve(state.appname))
    // could send config too...

    log('(ui) SENDING  >> ahoy:step')
    ipcRenderer.send('ahoy:step')
  })

  return state
}
