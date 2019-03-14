const electron = require('electron')
const join = require('path').join

module.exports = function serverWindow ({ config, plugins, appPath }) {
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
    const skipSetUpCheck = false // toggle to force ssb-ahoy to display

    win.webContents.executeJavaScript(
      script({ config, plugins, appPath, skipSetUpCheck })
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

function script ({ config, plugins = [], appPath, skipSetUpCheck = false }) {
  const _plugins = [
    'ssb-server/plugins/master',
    'ssb-server/plugins/local',
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt', // NOTE may be broken ? (sometimes stalls out replicating)
    'ssb-friends' // NOTE makes replication calls at the moment
    // 'ssb-invite')) // no pub invites at this step currently!
  ]
  plugins.forEach(plugin => {
    if (_plugins.includes(plugin)) return
    _plugins.push(`${appPath}/node_modules/${plugin}`)
  })

  return `
    var electron = require('electron')
    var h = require('mutant/h')
    var fs = require('fs')
    var checkSetUp = require('../../lib/is-set-up')
    var log = require('../../lib/log')
    var config = ${JSON.stringify(config)}

    var server
    
    electron.webFrame.setVisualZoomLevelLimits(1, 1)
    document.documentElement.querySelector('head').appendChild(
      h('title', 'InitialSync')
    )

    if (${skipSetUpCheck}) startAhoyServer()
    else {
      checkSetUp(config, (err, isSetUp) => {
        if (err) throw err

        if (isSetUp) electron.ipcRenderer.send('server-closed')
        // NOTE the server is already closed, but this signals to quit the electron app
        else startAhoyServer()
      })
    }


    electron.ipcRenderer.once('server-close', () => {
      log('(server) RECEIVED << server-close')
      server.close(() => electron.ipcRenderer.send('server-closed'))
    })

    function startAhoyServer () {
      var Server = require('ssb-server')
        ${_plugins.map(name => `.use(require('${name}'))`).join('')}

      server = Server(config)

      fs.writeFileSync(
        '${join(config.path, 'manifest.json')}',
        JSON.stringify(server.getManifest())
      )

      electron.ipcRenderer.send('server-started')
    }

  `
}
