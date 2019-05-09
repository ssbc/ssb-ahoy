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
      options: MutantArray(JSON5.parse(localStorage.ssbAhoyAppnames || '["ssb"]')),
      new: Value()
    },
    config: {
      current: Value(),
      next: Value()
    },
    searching: Value(false),
    loading: Value(false),
    saving: Value(false),
    quitting: Value(false)
  }

  watch(state.appname.selected, (appname) => {
    const config = Config(appname)
    // could just use os-home for path
    // but this creates fodlers / keys for us too..

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
    localStorage.ssbAhoyAppnames = JSON.stringify(options || ['ssb'])
  })

  watch(throttle(state.appname.new, 200), (name) => {
    if (!name) return
    if (state.appname.options.includes(name)) return

    state.searching.set(true)

    fs.stat(join(home, '.' + name, 'secret'), (err, data) => {
      state.searching.set(false)

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
        if (err) return console.error(err) // TODO handle error better

        state.config.current.set(clone(next))
        state.saving.set(false)
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
