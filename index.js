var defaultMenu = require('electron-default-menu')
var WindowState = require('electron-window-state')
var electron = require('electron')
const { Menu, ipcMain } = electron
var Path = require('path')
const Config = require('ssb-config/inject')
const Server = require('./server')

var openWindow = require('./window')

var windows = {}
var quitting = false

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
    quitting = true
  })

  // allow inspecting of background process
  electron.ipcMain.on('open-background-devtools', function (ev, config) {
    if (windows.background) {
      windows.background.webContents.openDevTools({ detach: true })
    }
  })
})

function PrimarySync () {
  if (windows.primarySync) return

  const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'ssb'
  const config = Config(appName, {
    friends: { hops: 1 }
  })

  Server(config)

  ipcMain.once('server-started', startPrimaryView)

  function startPrimaryView (ev, config) {
    console.log('server started!')

    var windowState = WindowState({
      defaultWidth: 1024,
      defaultHeight: 768
    })
    // just the window for this mode
    windows.primarySync = openWindow(Path.join(__dirname, 'views/primary.js'), {
      minWidth: 800,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      autoHideMenuBar: true,
      title: 'InitialSync',
      frame: false,
      titleBarStyle: 'hidden',
      show: true,
      backgroundColor: '#EEE',
      icon: './assets/icon.png'
    })
    windowState.manage(windows.primarySync)
    windows.primarySync.setSheetOffset(40)
    windows.primarySync.on('close', function (e) {
      if (!quitting && process.platform === 'darwin') {
        e.preventDefault()
        windows.primarySync.hide()
      }
    })
    windows.primarySync.on('closed', function () {
      windows.primarySync = null
      if (process.platform !== 'darwin') electron.app.quit()
    })
  }
}

ipcMain.on('log', function () { console.log(arguments) })
