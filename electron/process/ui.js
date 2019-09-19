const electron = require('electron')
const WindowState = require('electron-window-state')
const path = require('path')
const join = require('../../lib/join')

function validURL (str) {
  var pattern = new RegExp(
    '^(http?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return !!pattern.test(str)
}

module.exports = function uiWindow (uiPath, opts = {}, config) {
  var windowState = WindowState({
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
      icon: '../assets/icon.png' // TODO may need fixing
    },
    opts
  )

  var win = new electron.BrowserWindow(opts)
  windowState.manage(win)
  win.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })
  if (validURL(uiPath)) {
    console.log('IS URL')
    win.loadURL(uiPath)
  } else {
    console.log('NOT URL')
    uiPath = join('../..', uiPath)
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

    win.loadURL('file://' + path.join(__dirname, '../assets/base.html'))
  }

  return win
}
