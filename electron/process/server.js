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
    win.webContents.executeJavaScript(script(config, plugins))
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

function script (config, plugins = []) {
  return `
    var electron = require('electron')
    var h = require('mutant/h')
    var fs = require('fs')

    electron.webFrame.setVisualZoomLevelLimits(1, 1)
    document.documentElement.querySelector('head').appendChild(
      h('title', 'InitialSync')
    )

    // these are the Primary Server plugins
    var Server = require('ssb-server')
      .use(require('ssb-server/plugins/master'))
      .use(require('ssb-server/plugins/local'))
      .use(require('ssb-gossip'))
      .use(require('ssb-replicate'))
      .use(require('ssb-ebt'))
      .use(require('ssb-friends')) // TODO seems to be needed to replicate !
      // .use(require('ssb-invite')) // no pub invites at this step currently!
      ${plugins.map(name => `.use(require('${name}'))`).join('')}

    var server = Server(${JSON.stringify(config)})

    var manifest = server.getManifest()
    // electron.ipcRenderer.send('log', '${config.path}', manifest)

    fs.writeFileSync(
      '${join(config.path, 'manifest.json')}',
      JSON.stringify(manifest)
    )

    electron.ipcRenderer.send('server-started')

    electron.ipcRenderer.once('server-close', () => {
      console.log('server: RECEIVED << server-close')
      server.close()
      electron.ipcRenderer.send('server-closed')
    })
  `
}
