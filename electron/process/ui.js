const electron = require('electron')
const WindowState = require('electron-window-state')
const path = require('path')
const join = require('../../lib/join')

module.exports = function uiWindow ({ appPath, appURL }, opts = {}, config) {
  const windowState = WindowState({
    defaultWidth: 1024,
    defaultHeight: 768
  })
  opts = Object.assign(
    {
      title: 'scuttlebutt ahoy!',
      show: true,

      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 800,

      autoHideMenuBar: true,
      frame: process.env.ELECTRON_FRAME !== 'false',
      // titleBarStyle: 'hidden',
      backgroundColor: '#fff',
      // icon: '../assets/icon.png', // may not be needed
      webPreferences: { nodeIntegration: true }
    },
    opts
  )
  if (appURL) {
    opts.webPreferences = { nodeIntegration: false }
  }

  const win = new electron.BrowserWindow(opts)
  windowState.manage(win)
  win.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  if (appURL) win.loadURL(appURL)
  else {
    appPath = join('../..', appPath)
    win.webContents.on('dom-ready', function () {
      win.webContents.executeJavaScript(Script(appPath, opts, config))
    })

    win.loadURL('file://' + path.join(__dirname, '../assets/base.html'))
  }

  return win
}

function Script (appPath, opts, config) {
  return `
    var electron = require('electron')
    var h = require('mutant/h')
    electron.webFrame.setVisualZoomLevelLimits(1, 1)
    var title = ${JSON.stringify(opts.title || 'scuttlebutt ahoy!')}
    document.documentElement.querySelector('head').appendChild(
      h('title', title)
    )
    require('${appPath}')(${JSON.stringify(config)})
  `
}
