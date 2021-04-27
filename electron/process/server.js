const electron = require('electron')
const path = require('path')
const join = require('../../lib/join')

module.exports = function serverWindow ({ config, plugins, appDir }) {
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
    width: 150,
    webPreferences: { nodeIntegration: true }
  }
  const win = new electron.BrowserWindow(opts)

  win.webContents.on('dom-ready', function (ev) {
    win.webContents.executeJavaScript(script({ config, plugins, appDir }))
  })

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

function script ({ config, plugins = [], appDir }) {
  const manifestPath = join(config.path, 'manifest.json')

  return `
    var electron = require('electron')
    var fs = require('fs')
    var path = require('path')
    var Client = require('ssb-client')
    var caps = require('ssb-caps')
    var join = require('../../lib/join')
    var log = require('../../lib/log').bind(null, 'server')
    var config = ${JSON.stringify(config)}

    var server
    
    electron.webFrame.setVisualZoomLevelLimits(1, 1)

    startAhoyServer()

    electron.ipcRenderer.once('server-close', () => {
      log('RECEIVED << server-close')
      server.close()
      electron.ipcRenderer.send('server-closed')

      // NOTE this should work but it doesn't reliably
      // server.close(() => {
      //   electron.ipcRenderer.send('server-closed')
      // })
    })

    function startAhoyServer () {
      var SecretStack = require(join('../..', '${appDir}', 'node_modules/secret-stack'))
      var SSB = require(join('../..', '${appDir}', 'node_modules/ssb-db'))

      var Server = SecretStack({ caps: { shs: Buffer.from(caps.shs, 'base64') } })
        .use(SSB)
        ${plugins.map(name => `.use(require('${name}'))`).join('')}

      server = Server(config)
      const manifest = server.getManifest()

      fs.writeFile(
        '${manifestPath}',
        JSON.stringify(manifest, null, 2),
        (err) => {
          if (err) throw err

          config.manifest = manifest
          sendThumbsUp()
        }
      )
    }

    var failures = 0
    function sendThumbsUp () {
      Client(config.keys, config, (err, sbot) => {
        if (err) {
          if (failures++ > 7) throw err

          log('server not ready... , retrying (' + failures + ')')
          setTimeout(sendThumbsUp, 500)
          return
        }

        sbot.close() // close this remote connection (not the actual server)
        electron.ipcRenderer.send('server-started', config.manifest)
      })
    }
  `
}
