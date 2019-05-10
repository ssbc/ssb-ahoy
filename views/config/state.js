const { Value, resolve, watch, watchAll, Array: MutantArray, throttle } = require('mutant')
const { ipcRenderer } = require('electron')
const Config = require('ssb-config/inject')
const fs = require('fs')
const home = require('os-homedir')()
const { join } = require('path')

const JSON5 = require('json5')
const isEqual = require('lodash.isequal')
const clone = require('lodash.clone')

const log = require('../../lib/log')

module.exports = function State (config) {
  const state = {
    appname: {
      selected: Value('ssb'),
      options: MutantArray(),
      new: Value()
    },
    feedId: Value(),
    config: {
      current: Value(),
      next: Value()
    },
    searching: Value(false),
    loading: Value(false),
    saving: Value(false),
    error: Value(),
    quitting: Value(false)
  }
  
  loadStoredAppnames(state)

  watch(state.appname.selected, (appname) => {
    const config = Config(appname)

    state.feedId.set(config.keys.id)
    state.loading.set(true)

    fs.readFile(join(config.path, 'config'), 'utf8', (err, str) => {
      var customConfig
      if (err) customConfig = {}
      else customConfig = JSON5.parse(str) // TODO safer with try catch?

      state.config.current.set(customConfig)
      state.config.next.set(clone(customConfig))
      state.loading.set(false)
    })
  })

  watch(state.appname.options, (options) => {
    if (!options) return
    localStorage.ssbAhoyAppnames = JSON.stringify(options || ['ssb'])
  })

  watch(throttle(state.appname.new, 200), (name) => {
    if (!name) return
    if (state.appname.options.includes(name)) return

    state.searching.set(true)
    validAppname(name, (_, valid) => {
      state.searching.set(false)
      if (valid) {
        state.appname.options.push(name)
        state.appname.new.set('')
      }
    })

    fs.stat(join(home, '.' + name, 'secret'), (err, data) => {

      if (err) return // TODO propose new identity ?
      state.appname.options.push(name)
      state.appname.new.set('')
    })
  })

  watchAll([state.config.current, state.config.next, state.loading], (current, next, loading) => {
    if (loading) return
    if (isEqual(current, next)) return

    state.saving.set(true)
    fs.writeFile(
      join(home, '.' + resolve(state.appname.selected), 'config'),
      JSON.stringify(next, null, 2),
      (err) => {
        if (err) return state.error.set(err)

        state.config.current.set(clone(next))
        state.saving.set(false)
        state.error.set()
      }
    )
  })

  watch(state.quitting, quitting => {
    if (!quitting) return

    ipcRenderer.send('ahoy:appname', resolve(state.appname.selected)) // could send config too...

    log('(ui) SENDING  >> ahoy:step')
    ipcRenderer.send('ahoy:step')
  })

  return state
}

function validAppname (name, cb) {
  fs.stat(join(home, '.' + name, 'secret'), (err, data) => {
    if (err) cb(null, false)
    else cb(null, true)
  })
}

function loadStoredAppnames (state) {
  const appnames = ['ssb']
    .concat(JSON5.parse(localStorage.ssbAhoyAppnames || '[]'))

  appnames.forEach(name => {
    validAppname(name, (_, valid) => {
      if (!valid) return
      if (state.appname.options.includes(name)) return

      state.appname.options.push(name)
    })
  })
}
