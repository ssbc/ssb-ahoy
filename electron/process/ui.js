const electron = require('electron')
const WindowState = require('electron-window-state')
const path = require('path')
const join = require('../../lib/join')

module.exports = function uiWindow (uiPath, opts = {}, config) {
  uiPath = join('../..', uiPath)

  var windowState = WindowState({
    defaultWidth: 1024,
    defaultHeight: 768
  })

  opts = Object.assign({
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
    icon: '../assets/icon.png' // TODO may need fixing
  }, opts)

  var win = new electron.BrowserWindow(opts)
  windowState.manage(win)

  win.webContents.on('dom-ready', function () {
    win.webContents.executeJavaScript(Script(uiPath, opts, config))
  })

  function Script (uiPath, opts, config) {
    return `
      var electron = require('electron')
      var h = require('mutant/h')
      electron.webFrame.setVisualZoomLevelLimits(1, 1)
      var title = ${JSON.stringify(opts.title || 'scuttlebutt ahoy!')}
      document.documentElement.querySelector('head').appendChild(
        h('title', title)
      )
      require('${uiPath}')(${JSON.stringify(config)})
    `
  }

  win.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.loadURL('file://' + path.join(__dirname, '../assets/base.html'))
  return win
}
