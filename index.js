const electron = require('electron')
const { ipcMain } = electron

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')
const Plugins = require('./lib/build-plugins')
const ConfigLocal = require('./lib/build-config-local')
// const MinimalPlugins = require('./plugins-minimal')
// const CheckSetUp = require('./lib/is-set-up') // not used currently
const join = require('./lib/join')
const log = require('./lib/log').bind(null, 'main')

const Config = require('./lib/build-config')

module.exports = function ahoy (opts, onReady = noop) {
  var {
    title,
    plugins = [],
    appDir = '../..',
    appPath,
    appURL
  } = opts

  if (!Array.isArray(plugins)) throw Error('ssb-ahoy: plugins must be an array')
  if (plugins.length && typeof appDir !== 'string') throw Error('ssb-ahoy: expects valid appDir')
  if (!appPath && !appURL) throw Error('ssb-ahoy: expects EITHER appPath OR appURL')
  if (appPath && appURL) throw Error('ssb-ahoy: expects EITHER appPath OR appURL, not both')
  // TODO better checking of appPath and appURL
  if (appPath && typeof appPath !== 'string') throw Error('ssb-ahoy: expects valid appPath')
  if (appURL && typeof appURL !== 'string') throw Error('ssb-ahoy: expects valid appURL')
  if (typeof onReady !== 'function') throw Error('ssb-ahoy: expects valid onReady function')

  const state = {
    loadingConfig: false,
    isStepping: false,
    steps: Steps(),
    step: -1,
    windows: {
      server: null,
      ui: null
    },
    quitting: false
  }

  function Steps (config) {
    const configLocal = config ? ConfigLocal(config) : false

    return [
      {
        appPath: './views/config/index.js'
      },
      { // replication + indexing (locally)
        config: configLocal,
        // plugins: MinimalPlugins(appDir), // TODO maybe seperate replication + indexing
        plugins: Plugins({ plugins, appDir }),
        appPath: './views/replication/index.js'
      },
      { // start user app
        title,
        config,
        plugins: Plugins({ plugins, appDir }),
        appURL: appURL || null,
        appPath: appPath ? join(appDir, appPath) : null
      }
    ]
  }

  electron.app.on('ready', () => {
    // TODO check this is even used. I think this needs to be called in the UI windows?
    Menu()

    electron.app.on('before-quit', function (e) {
      if (state.isStepping) e.preventDefault()
      else {
        state.quitting = true
        log('quitting')
      }
    })

    // allow inspecting of background process
    electron.ipcMain.on('open-background-devtools', function (ev, config) {
      if (state.windows.server) {
        state.windows.server.webContents.openDevTools({ mode: 'detach' })
      }
    })

    step() // Start up the next step

    ipcMain.once('ahoy:appname', (ev, appname, config) => {
      state.steps = Steps(Config(appname))
      // load the config fresh off just the appname to be safe...

      state.loadingConfig = false
    })
    ipcMain.on('ahoy:prepare-to-launch', () => {
      state.step = state.steps.length - 2 // progress to (before) final step
    })
    ipcMain.on('ahoy:step', step)
    // TODO could check if an account is setup and offer different options
    // in the config screen accordingly?
    ipcMain.on('ahoy:log', log)

    electron.app.on('activate', function (e) {
      // reopen the app when dock icon clicked on macOS
      if (state.windows.ui) state.windows.ui.show()
    })
  })

  function step () {
    if (state.step > 0 && state.loadingConfig) return setTimeout(step, 100)

    state.isStepping = true
    state.step++
    if (!state.steps[state.step]) throw Error("ahoy! you're sailing off the map!")

    if (!state.windows.server && !state.windows.ui) StartNextStep()
    else {
      clearServer(() => {
        clearUI()

        console.log('  ---------------')
        StartNextStep() // start next server, then start next UI
      })
    }
  }

  function clearServer (cb) {
    if (!state.windows.server) return cb() // this is a UI-only based step

    log('clearing Server')
    state.windows.server.webContents.send('server-close')
    ipcMain.once('server-closed', () => {
      log('RECEIVED << server-closed')

      state.windows.server = null
      cb()
    })
  }
  function clearUI () {
    if (!state.windows.ui) return

    log('clearing UI')

    state.windows.ui.close()
    // state.windows.ui.hide()
    // const _ui = state.windows.ui
    // setTimeout(() => _ui.close(), 5e3)
    // HACK ... if we close the ui immediately electron seems to quit out,
    // maybe because there are no open windows between step 0 & 1
    // ... could see if we could listen for a close / quit event and preventDefault

    state.windows.ui = null
  }

  function StartNextStep () {
    state.isStepping = false
    StartServer(StartUI)
  }

  function StartServer (cb) {
    if (state.windows.server) throw Error('ahoy: you can only have one server at a time!')

    const { config, plugins } = state.steps[state.step]
    if (!config && !plugins) return cb() // because a UI-only based step
    // if (!plugins) return cb() // because a UI-only based step

    log('starting Server')
    state.windows.server = Server({ config, plugins, appDir })
    ipcMain.once('server-started', cb)
  }

  function StartUI () {
    log('starting UI')
    const { appPath, appURL, title, config } = state.steps[state.step]

    const ui = UI({ appPath, appURL }, { title }, config)
    ui.setSheetOffset(40)
    ui.on('close', function (e) {
      if (process.platform === 'darwin') {
        if (!state.quitting) {
          e.preventDefault()
          ui.hide()
        }
      } else {
        if (!state.isStepping) electron.app.quit()
      }
      // if (!state.quitting && process.platform === 'darwin') {
      //   e.preventDefault()
      //   ui.hide()
      // }
    })
    state.windows.ui = ui
    ui.on('closed', function () {
      state.windows.ui = null
    })

    if (state.step === state.steps.length - 1) {
      onReady({
        windows: state.windows,
        config
      })
    }
  }
}

function noop () {}
