const { Value, resolve, watch, watchAll, Array: MutantArray, throttle } = require('mutant')
const { ipcRenderer } = require('electron')
const Config = require('ssb-config/inject')
const fs = require('fs')
const home = require('os').homedir()
const { join } = require('path')

const JSON5 = require('json5')
const isEqual = require('lodash.isequal')
const clone = require('lodash.clone')
const merge = require('lodash.merge')

const log = require('../../lib/log').bind(null, 'ui')

module.exports = function State (config) {
  const state = {
    appname: {
      selected: Value('ssb'),
      options: MutantArray(),
      new: Value()
    },
    feedId: Value(),
    config: {
      isEditing: Value(false),
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
    localStorage.ssbAhoyAppnames = JSON.stringify(options || ['ssb']) // eslint-disable-line
  })

  watch(throttle(state.appname.new, 200), (name) => {
    if (!name) return
    if (state.appname.options.includes(name)) return

    state.searching.set(true)
    validAppname(name, (_, valid) => {
      state.searching.set(false)
      if (valid) {
        state.appname.options.push(name)
        state.appname.selected.set(name)
        state.appname.new.set('')
      }
    })
  })

  watchAll([state.config.current, state.config.next, state.loading], (current, next, loading) => {
    if (loading) return
    if (isEqual(current, next)) return

    preserveCaps(current, next)

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
      .catch(err => { console.trace(err) })

    log('SENDING  >> ahoy:step')
    ipcRenderer.send('ahoy:step')
      .catch(err => { console.trace(err) })
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
    .concat(JSON5.parse(localStorage.ssbAhoyAppnames || '[]')) // eslint-disable-line

  appnames.forEach(name => {
    validAppname(name, (_, valid) => {
      if (!valid) return
      if (state.appname.options.includes(name)) return

      state.appname.options.push(name)
    })
  })
}

// this isn't perfect but it prevents people from over-writing a valid caps.sign,
// which could lead to them irreperably forking their feed
function preserveCaps (current, next) {
  const sign = current.caps && current.caps.sign

  if (sign && validSign(sign)) {
    merge(next, {
      caps: { sign }
    })
  }
}

function validSign (str) {
  return str.length === 44 && str.endsWith('=')
}
