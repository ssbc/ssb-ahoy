const electron = require('electron')
const join = require('path').join

module.exports = function window (path, opts) {
  var win = new electron.BrowserWindow(opts)
  win.webContents.on('dom-ready', function () {
    win.webContents.executeJavaScript(`
      var electron = require('electron')
      var h = require('mutant/h')
      electron.webFrame.setVisualZoomLevelLimits(1, 1)
      var title = ${JSON.stringify(opts.title || 'InitialSync')}
      document.documentElement.querySelector('head').appendChild(
        h('title', title)
      )
      require(${JSON.stringify(path)})
    `)
  })

  win.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.loadURL('file://' + join(__dirname, 'assets', 'base.html'))
  return win
}
