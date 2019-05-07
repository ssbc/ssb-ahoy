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

module.exports = function ahoy (opts, onReady = noop) {
  const {
    title,
    config,
    plugins = [],
    appDir = '../..',
    uiPath
  } = opts

  if (typeof config !== 'object' || !config.keys) throw Error('ssb-ahoy: expects valid server config')
  if (!Array.isArray(plugins)) throw Error('ssb-ahoy: plugins must be an array')
  if (plugins.length && typeof appDir !== 'string') throw Error('ssb-ahoy: expects valid appDir')
  if (typeof uiPath !== 'string') throw Error('ssb-ahoy: expects valid uiPath')
  if (typeof onReady !== 'function') throw Error('ssb-ahoy: expects valid onReady function')

  const configLocal = ConfigLocal(config)

  const state = {
    steps: [
      { // focus of log replication
        config: configLocal,
        plugins: MinimalPlugins(appDir),
        uiPath: './views/replication/index.js' // TODO auto-progress?
      },
      { // focus on indexing
        config: configLocal,
        plugins: Plugins({ plugins, appDir }),
        uiPath: './views/indexing/index.js'
      },
      { // start user app
        title,
        config,
        plugins: Plugins({ plugins, appDir }),
        uiPath: join(appDir, uiPath)
      }
    ],
    step: -1,
    windows: {
      server: null,
      ui: null
    },
    quitting: false
  }

  electron.app.on('ready', () => {
    Menu()

    electron.app.on('before-quit', function () {
      state.quitting = true
    })

    // allow inspecting of background process
    electron.ipcMain.on('open-background-devtools', function (ev, config) {
      if (state.windows.server) {
        state.windows.server.webContents.openDevTools({ mode: 'detach' })
      }
    })

    CheckSetUp(config, appDir, (err, isSetUp) => {
      if (err) throw err

      if (isSetUp) state.step = state.steps.length - 2 // step before final step
      Start()
    })
  })

  function Start () {
    step()
    ipcMain.on('ahoy:step', step)
    electron.app.on('activate', function (e) {
      // reopen the app when dock icon clicked on macOS
      if (state.windows.ui) state.windows.ui.show()
    })

    ipcMain.on('ahoy:log', log)
  }

  function step () {
    state.step++
    if (!state.steps[state.step]) throw Error("ahoy! you're sailing off the map!")

    if (!state.windows.server) StartNextStep()
    else {
      clearServer(() => {
        clearUI()

        console.log('# ---------------')
        StartNextStep() // start new server, then start new UI
      })
    }
  }

  function clearServer (cb) {
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
    // state.windows.ui.webContents.executeJavascript("console.log('scoop it out!')")

    state.windows.ui.close()
    state.windows.ui = null
  }

  function StartNextStep () {
    StartServer()
    ipcMain.once('server-started', StartUI)
  }

  function StartServer () {
    if (state.windows.server) throw Error('ahoy: you can only have one server at a time!')

    log('(main) starting Server')
    const { config, plugins } = state.steps[state.step]
    state.windows.server = Server({ config, plugins, appDir })
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
