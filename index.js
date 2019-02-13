const electron = require('electron')
const { ipcMain } = electron
const Config = require('ssb-config/inject')
const Path = require('path')

const Menu = require('./electron/menu')
const Server = require('./electron/process/server')
const UI = require('./electron/process/ui')

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

  // electron.ipcMain.once('primary-sync-completed', function (ev) {
  //   console.log('> primary sync completed')
  // })

  electron.app.on('before-quit', function () {
    state.quitting = true
  })

  // allow inspecting of background process
  // electron.ipcMain.on('open-background-devtools', function (ev, config) {
  //   if (state.windows.background) {
  //     state.windows.background.webContents.openDevTools({ detach: true })
  //   }
  // })
  //
  Onboard()
})

function Onboard () {
  if (state.windows.primarySync) return

  // const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'ssb'
  const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'xim' // TODO change
  const config = Config(appName, {
    friends: { hops: 2 }
  })
  const plugins = ['ssb-private', 'ssb-backlinks', 'ssb-about', 'ssb-query', 'ssb-suggest']

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

// TEMP? relay server close message out to the server rendered (process)
// Possible improvement: send messages directly between windows with
//   https://github.com/electron/electron/blob/v2.0.16/docs/api/ipc-renderer.md#ipcrenderersendtowindowid-channel--arg1-arg2-

ipcMain.on('server-close', function () {
  console.log('main: RELAYING <<>> server-close')
  if (!state.windows.server) return
  state.windows.server.webContents.send('server-close')
})

ipcMain.on('server-closed', function () {
  electron.app.quit()
})

ipcMain.on('log', function () { console.log(arguments) })
