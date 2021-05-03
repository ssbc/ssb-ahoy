const electron = require('electron')
const path = require('path')
const join = require('../../lib/join')

const DEBUGGING = process.env.AHOY_SHOW_SERVER
  ? process.env.AHOY_SHOW_SERVER === 'true'
  : process.env.NODE_ENV === 'development'
// if true shows the backend renderer, and opens the devtools in it

module.exports = function serverWindow ({ config, plugins, appDir }) {
  const opts = {
    title: 'server',
    show: DEBUGGING,
    connect: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
      // TODO mix 2021-04-28 : find way to enable contextIsolation
      // ideally contextIsolation should be true (security)
      // this means we cannot run executeJavaScript with require statements though
      // preload: path.join(__dirname, '../preload.js')
      // TODO mix 2021-04-28 explore preload
      // consider writing all the code to be run (including plugins) to a file and just passing it to a static file and passing this to preload..., may involve way less path hacking
    }
  }
  const win = new electron.BrowserWindow(opts)
  if (DEBUGGING) win.webContents.openDevTools()

  win.webContents.on('dom-ready', function (ev) {
    win.webContents.executeJavaScript(script({ config, plugins, appDir }))
      .catch(err => {
        if (err.message === 'An object could not be cloned.') return
        // NOTE this error is generated by the line (below in script):
        // electron.ipcRenderer.once()
        // seems to be safe to ignore?

        console.trace(err)
      })
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
    .catch(err => { console.trace(err) })

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
      server && server.close()
      electron.ipcRenderer.send('server-closed')
        .catch(err => { console.trace(err) })

      // NOTE this should work but it doesn't reliably
      // server.close(() => {
      //   electron.ipcRenderer.send('server-closed')
      // })
    })

    function startAhoyServer () {
      var SecretStack = require(join('../..', '${appDir}', 'node_modules/secret-stack'))

      var Server = SecretStack({ caps: { shs: Buffer.from(caps.shs, 'base64') } })
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
      electron.ipcRenderer.send('server-started', config.manifest)
      Client(config.keys, config, (err, client) => {
        if (err) {
          if (failures++ > 7) throw err

          log('server not ready... , retrying (' + failures + ')')
          setTimeout(sendThumbsUp, 500)
          return
        }
        client.close() // close this remote connection (not the actual server)
        electron.ipcRenderer.send('server-started', config.manifest)
          .catch(err => { console.trace(err) })
      })
    }
  `
}
