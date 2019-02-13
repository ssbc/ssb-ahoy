const electron = require('electron')
const { ipcMain } = electron
const Path = require('path')

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')

module.exports = function ahoy (config, plugins = [], next) {
  if (typeof config !== 'object' || !config.keys) throw new Error('ssb-ahoy: expects valid server config')
  if (!Array.isArray(plugins)) throw new Error('ssb-ahoy: plugins must be an array')
  if (typeof next !== 'function') throw new Error('ssb-ahoy: next must be a function')

  const state = {
    windows: {
      server: null,
      ui: null
    },
    quitting: false
  }

  console.log('STARTING electron')
  electron.app.on('ready', () => {
    Menu() // NOT WORKING?!!

    // could do multiple phases of sync in future
    // electron.ipcMain.once('primary-sync-completed', function (ev) {
    //   console.log('> primary sync completed')
    // })

    electron.app.on('before-quit', function () {
      state.quitting = true
    })

    // allow inspecting of background process
    electron.ipcMain.on('open-background-devtools', function (ev, config) {
      if (state.windows.background) {
        state.windows.background.webContents.openDevTools({ detach: true })
      }
    })

    Onboard()
  })

  function Onboard () {
    if (state.windows.primarySync) return

    state.windows.server = Server(config, plugins)

    ipcMain.once('server-started', () => {
      console.log('starting UI!')

      state.windows.ui = UI(Path.join(__dirname, 'views/index.js'), {}, config)

      state.windows.ui.setSheetOffset(40)
      state.windows.ui.on('close', function (e) {
        if (!state.quitting && process.platform === 'darwin') {
          e.preventDefault()
          state.windows.ui.hide()
        }
      })
      state.windows.ui.on('closed', function () {
        state.windows.ui = null
        if (process.platform !== 'darwin') electron.app.quit()
      })
    })
  }

  ipcMain.on('server-close', function () {
    console.log('main: RELAYING <<>> server-close')
    if (!state.windows.server) return
    state.windows.server.webContents.send('server-close')
  })

  ipcMain.on('server-closed', function () {
    electron.app.quit()
    next()
  })

  ipcMain.on('log', function () { console.log(arguments) })
}
