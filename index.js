var defaultMenu = require('electron-default-menu')
var WindowState = require('electron-window-state')
var electron = require('electron')
const { Menu, ipcMain } = electron
var Path = require('path')
const Config = require('ssb-config/inject')
const Server = require('./server')

var openWindow = require('./window')

var windows = {
  server: null,
  frontend: null
}

const state = {

  quitting: false
}

console.log('STARTING electron')
electron.app.on('ready', () => {
  var menu = defaultMenu(electron.app, electron.shell)
  var view = menu.find(x => x.label === 'View')
  view.submenu = [
    { role: 'reload' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
  if (process.platform === 'darwin') {
    var win = menu.find(x => x.label === 'Window')
    win.submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close', label: 'Close' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))

  PrimarySync()

  electron.ipcMain.once('primary-sync-completed', function (ev) {
    console.log('> primary sync completed')
  })

  electron.app.on('before-quit', function () {
    state.quitting = true
  })

  // allow inspecting of background process
  // electron.ipcMain.on('open-background-devtools', function (ev, config) {
  //   if (windows.background) {
  //     windows.background.webContents.openDevTools({ detach: true })
  //   }
  // })
})

function PrimarySync () {
  if (windows.primarySync) return

  // const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'ssb'
  const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'xim' // TODO change
  const config = Config(appName, {
    friends: { hops: 2 }
  })

  const plugins = ['ssb-about', 'ssb-private', 'ssb-query', 'ssb-suggest']
  windows.server = Server(config, plugins)

  ipcMain.once('server-started', () => startPrimaryView(config))

  function startPrimaryView (config) {
    console.log('server started!')

    var windowState = WindowState({
      defaultWidth: 1024,
      defaultHeight: 768
    })
    // just the window for this mode
    windows.frontend = openWindow(Path.join(__dirname, 'views/primary.js'), {
      minWidth: 800,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height
    }, config)
    windowState.manage(windows.frontend)
    windows.frontend.setSheetOffset(40)
    windows.frontend.on('close', function (e) {
      if (!state.quitting && process.platform === 'darwin') {
        e.preventDefault()
        windows.frontend.hide()
      }
    })
    windows.frontend.on('closed', function () {
      windows.frontend = null
      if (process.platform !== 'darwin') electron.app.quit()
    })
  }
}

// TEMP? relay server close message out to the server rendered (process)
// Possible improvement: send messages directly between windows with
//   https://github.com/electron/electron/blob/v2.0.16/docs/api/ipc-renderer.md#ipcrenderersendtowindowid-channel--arg1-arg2-

ipcMain.on('server-close', function () {
  console.log('main: RELAYING server-close')
  if (!windows.server) return
  windows.server.webContents.send('server-close')
})

ipcMain.on('log', function () { console.log(arguments) })
