const electron = require('electron')
const { ipcMain } = electron
const { join } = require('path')

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')
const log = require('./lib/log')

module.exports = function ahoy (opts) {
  const {
    config,
    plugins = [],
    pluginsDir,
    uiPath,
    onReady = () => {}
  } = opts

  if (typeof config !== 'object' || !config.keys) throw Error('ssb-ahoy: expects valid server config')
  if (!Array.isArray(plugins)) throw Error('ssb-ahoy: plugins must be an array')
  if (plugins.length && typeof pluginsDir !== 'string') throw Error('ssb-ahoy: expects valid pluginsDir')
  if (typeof uiPath !== 'string') throw Error('ssb-ahoy: expects valid uiPath')
  if (typeof onReady !== 'function') throw Error('ssb-ahoy: expects valid onReady function')

  const minimalPlugins = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/logging',
    'ssb-server/plugins/unix-socket',
    'ssb-server/plugins/no-auth',
    // 'ssb-server/plugins/onion',
    'ssb-server/plugins/local',

    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt',
    'ssb-friends',
    'ssb-invite'
  ]
  const state = {
    steps: [
      // TODO // a "check setup step?"
      { config, plugins: minimalPlugins, uiPath: join(__dirname, 'views/index.js') },
      { config, plugins: buildPlugins({ plugins, pluginsDir }), uiPath: join(__dirname, 'views/index.js') },
      { config, plugins: buildPlugins({ plugins, pluginsDir }), uiPath }
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
        state.windows.server.webContents.openDevTools({ detach: true })
      }
    })

    step()
  })

  function step () {
    state.step++

    if (!state.steps[state.step]) throw Error("ahoy! you're sailing off the map!")

    // close connection to server
    // - done on client side?

    // close the server
    if (!state.windows.server) {
      StartNextStep()
    } else {
      clearServer(() => {
        // scoop out the contents of the UI
        // (later) close UI
        clearUI()

        // start new server, then start new UI
        setTimeout(StartNextStep, 500)
      })
    }
  }
  ipcMain.on('ahoy:step', step)

  function clearServer (cb) {
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
    // state.windows.ui.close()
    state.windows.ui.hide()
    state.windows.ui = null
  }

  function StartNextStep () {
    StartServer()
    ipcMain.once('server-started', StartUI)
    // ipcMain.on('server-started', StartUI) // TODO check where this listener should be
  }

  function StartServer () {
    if (state.windows.server) throw Error('ahoy: you can only have one server at a time!')

    const { config, plugins } = state.steps[state.step]

    state.windows.server = Server({ config, plugins })
  }

  function StartUI () {
    console.log('STARTING UI')
    const { uiPath, config } = state.steps[state.step]

    state.windows.ui = UI(uiPath, {}, config)

    state.windows.ui.setSheetOffset(40)
    state.windows.ui.on('close', function (e) {
      if (process.platform !== 'darwin') return
      if (state.quitting) return

      e.preventDefault()
      state.windows.ui.hide()
    })
    state.windows.ui.on('closed', function () {
      state.windows.ui = null
      if (process.platform !== 'darwin') electron.app.quit()
    })
  }

  ipcMain.on('server-close', function () {
    log('(main) RELAYING <> server-close')
    if (state.windows.server) state.windows.server.webContents.send('server-close')
  })

  // ipcMain.on('server-closed', function () {
  //   log('(main) RECEIVED << server-closed')
  //   if (state.windows.ui) state.windows.ui.hide()

  //   electron.app.quit()
  // })

  ipcMain.on('log', log)
}

function buildPlugins ({ plugins, pluginsDir }) {
  var _plugins = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/local',
    'ssb-server/plugins/unix-socket', // in case config includes sockets
    'ssb-server/plugins/no-auth', // in case config includes sockets
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt', // NOTE may be broken ? (sometimes stalls out replicating)
    'ssb-friends' // NOTE makes replication calls at the moment
    // 'ssb-invite')) // no pub invites at this step currently!
  ]
  plugins.forEach(plugin => {
    if (_plugins.includes(plugin)) return
    _plugins.push(`${pluginsDir}/${plugin}`)
  })

  return _plugins
}
