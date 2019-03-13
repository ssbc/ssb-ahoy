const electron = require('electron')
const { ipcMain } = electron
const Path = require('path')

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')
const log = require('./lib/log')

module.exports = function ahoy (config, plugins = []) {
  if (typeof config !== 'object' || !config.keys) throw new Error('ssb-ahoy: expects valid server config')
  if (!Array.isArray(plugins)) throw new Error('ssb-ahoy: plugins must be an array')

  const state = {
    windows: {
      server: null,
      ui: null
    },
    quitting: false,
    exitCode: 0 // TODO allow exit code to be changed to 1
  }

  electron.app.on('ready', () => {
    Menu() // NOT WORKING?!!

    // could do multiple phases of sync in future
    // electron.ipcMain.once('primary-sync-completed', function (ev) {
    //   log('> primary sync completed')
    // })

    electron.app.on('before-quit', function () {
      state.quitting = true
    })

    // electron.app.on('will-quit', function (ev) {
    //   ev.preventDefault()
    // })

    // allow inspecting of background process
    electron.ipcMain.on('open-background-devtools', function (ev, config) {
      if (state.windows.background) {
        state.windows.background.webContents.openDevTools({ detach: true })
      }
    })

    Onboard()
  })

  function Onboard () {
    if (state.windows.server) return

    state.windows.server = Server(config, plugins)

    // TODO start the UI early, have UI window show loading spinner
    // listen in the UI window for server-started to launch App

    ipcMain.once('server-started', () => {
      state.windows.ui = UI(Path.join(__dirname, 'views/index.js'), {}, config)

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
    })
  }

  ipcMain.on('server-close', function () {
    log('(main) RELAYING <> server-close')
    if (!state.windows.server) return
    state.windows.server.webContents.send('server-close')
  })

  ipcMain.on('server-closed', function () {
    state.windows.ui.hide()
    if (state.exitCode === 0) electron.app.quit()
    else electron.app.exit(state.exitCode)
  })

  ipcMain.on('log', log)
}
