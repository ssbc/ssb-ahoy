const electron = require('electron')
const join = require('path').join

module.exports = function serverWindow ({ config, plugins }) {
  const opts = {
    title: 'initial sync server',
    show: false,
    connect: false,
    center: true,
    fullscreen: false,
    fullscreenable: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    skipTaskbar: true,
    useContentSize: true,
    height: 150,
    width: 150
  }
  var win = new electron.BrowserWindow(opts)

  win.webContents.on('dom-ready', function (ev) {
    win.webContents.executeJavaScript(
      script({ config, plugins })
    )
  })

  win.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  win.loadURL('file://' + join(__dirname, '../assets/base.html'))
  return win
}

function script ({ config, plugins = [] }) {
  return `
    var electron = require('electron')
    var h = require('mutant/h')
    var fs = require('fs')
    var log = require('../../lib/log')
    var config = ${JSON.stringify(config)}

    var server
    
    electron.webFrame.setVisualZoomLevelLimits(1, 1)
    document.documentElement.querySelector('head').appendChild(
      h('title', 'InitialSync')
    )

    startAhoyServer()

    electron.ipcRenderer.once('server-close', () => {
      log('(server) RECEIVED << server-close')
      server.close(() => electron.ipcRenderer.send('server-closed'))
    })

    function startAhoyServer () {
      var Server = require('ssb-server').createSsbServer()
        ${plugins.map(name => `.use(require('${name}'))`).join('')}

      server = Server(config)

      fs.writeFileSync(
        '${join(config.path, 'manifest.json')}',
        JSON.stringify(server.getManifest())
      )

      electron.ipcRenderer.send('server-started')
    }
  `
}
