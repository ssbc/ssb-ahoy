const electron = require('electron')
const join = require('path').join

module.exports = function serverWindow (config, plugins) {
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

  win.webContents.on('dom-ready', function () {
    const skipSetUpCheck = false // toggle to force ssb-ahoy to display. TODO process.env this?
    win.webContents.executeJavaScript(script(config, plugins, skipSetUpCheck))
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

function script (config, plugins = [], skipSetUpCheck = false) {
  const requiredPlugins = [
    'ssb-gossip',
    'ssb-replicate',
    'ssb-ebt',
    'ssb-friends' // TODO seems to be needed to replicate !
    // 'ssb-invite')) // no pub invites at this step currently!
  ]

  plugins = Array.from(
    new Set([ ...requiredPlugins, ...plugins ])
  )

  return `
    var electron = require('electron')
    var h = require('mutant/h')
    var fs = require('fs')
    var isSetUp = require('../../lib/is-set-up')
    var log = require('../../lib/log')
    
    electron.webFrame.setVisualZoomLevelLimits(1, 1)
    document.documentElement.querySelector('head').appendChild(
      h('title', 'InitialSync')
    )

    // these are the Primary Server plugins
    var Server = require('ssb-server')
      .use(require('ssb-server/plugins/master'))
      .use(require('ssb-server/plugins/local'))
      ${plugins.map(name => `.use(require('${name}'))`).join('')}

    var server = Server(${JSON.stringify(config)})

    var manifest = server.getManifest()
    // electron.ipcRenderer.send('log', '${config.path}', manifest)

    fs.writeFileSync(
      '${join(config.path, 'manifest.json')}',
      JSON.stringify(manifest)
    )

    if (${skipSetUpCheck}) electron.ipcRenderer.send('server-started')
    else isSetUp(server)((err, _is) => {
      if (err) throw err

      if (_is) {
        server.close()
        electron.ipcRenderer.send('server-closed')
      } else {
        electron.ipcRenderer.send('server-started')
      }
    })

    electron.ipcRenderer.once('server-close', () => {
      log('(server) RECEIVED << server-close')
      server.close()
      electron.ipcRenderer.send('server-closed')
    })
  `
}
