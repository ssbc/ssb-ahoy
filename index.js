const electron = require('electron')
const { ipcMain } = electron

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')
const Plugins = require('./lib/build-plugins')
const ConfigLocal = require('./lib/build-config-local')
const MinimalPlugins = require('./plugins-minimal')
const CheckSetUp = require('./lib/is-set-up')
const join = require('./lib/join')
const log = require('./lib/log')

const Config = require('./lib/build-config')

module.exports = function ahoy (opts, onReady = noop) {
  const {
    title,
    plugins = [],
    appDir = '../..',
    uiPath
  } = opts

  if (!Array.isArray(plugins)) throw Error('ssb-ahoy: plugins must be an array')
  if (plugins.length && typeof appDir !== 'string') throw Error('ssb-ahoy: expects valid appDir')
  if (typeof uiPath !== 'string') throw Error('ssb-ahoy: expects valid uiPath')
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
        uiPath: './views/config/index.js'
      },
      // { // focus of log replication
      //   config: configLocal,
      //   plugins: MinimalPlugins(appDir),
      //   uiPath: './views/replication/index.js' // TODO auto-progress?
      // },
      // { // focus on indexing
      //   config: configLocal,
      //   plugins: Plugins({ plugins, appDir }),
      //   uiPath: './views/indexing/index.js'
      // },
      { // start user app
        title,
        config,
        plugins: Plugins({ plugins, appDir }),
        uiPath: join(appDir, uiPath)
      }
    ]
  }

  electron.app.on('ready', () => {
    // TODO - check this is even used. I think this needs to be called in the UI windows?
    Menu()

    electron.app.on('before-quit', function (e) {
      if (state.isStepping) e.preventDefault()
      else console.log('before-quit')
    })

    // allow inspecting of background process
    electron.ipcMain.on('open-background-devtools', function (ev, config) {
      if (state.windows.server) {
        state.windows.server.webContents.openDevTools({ mode: 'detach' })
      }
    })

    // TODO move this to after first step ...
    // or make first step include buttons to manualy choose
    // CheckSetUp(config, appDir, (err, isSetUp) => {
      // if (err) throw err

      // if (isSetUp) state.step = state.steps.length - 2 // progress to (before) final step

      step() // Start up the next step

      ipcMain.once('ahoy:appname', (ev, appname, config) => {
        state.steps = Steps(Config(appname))
        // load the config fresh off just the appname to be safe...

        state.loadingConfig = false
      })
      ipcMain.on('ahoy:step', step)
      ipcMain.on('ahoy:log', log)
      electron.app.on('activate', function (e) {
        // reopen the app when dock icon clicked on macOS
        if (state.windows.ui) state.windows.ui.show()
      })
    // })
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

        console.log('# ---------------')
        StartNextStep() // start next server, then start next UI
      })
    }
  }

  function clearServer (cb) {
    if (!state.windows.server) return cb() // this is a UI-only based step

    log('(main) clearing Server')
    state.windows.server.webContents.send('server-close')
    ipcMain.once('server-closed', () => {
      log('(main) RECEIVED << server-closed')

      state.windows.server = null
      cb()
    })
  }
  function clearUI () {
    if (!state.windows.ui) return

    log('(main) clearing UI')

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

    log('(main) starting Server')
    state.windows.server = Server({ config, plugins, appDir })
    ipcMain.once('server-started', StartUI)
  }

  function StartUI () {
    log('(main) starting UI')
    const { uiPath, title, config } = state.steps[state.step]
    const ui = UI(uiPath, { title }, config)
    state.windows.ui = ui

    ui.setSheetOffset(40)
    ui.on('close', function (e) {
      if (!state.quitting && process.platform === 'darwin') {
        e.preventDefault()
        ui.hide()
      }
    })
    ui.on('closed', function () {
      state.windows.ui = null
    })

    if (state.step === state.steps.length - 1) onReady({ windows: state.windows })
  }
}

function noop () {}
