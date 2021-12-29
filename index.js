const electron = require('electron')
const { ipcMain } = electron
const { promisify } = require('util')

const Menu = require('./electron/menu')
const UI = require('./electron/process/ui')
const logger = require('./lib/log')
const log = logger.bind(null, 'main')

const Config = require('./lib/build-config')

module.exports = function ahoy (opts, cb) {
  if (cb === undefined) return promisify(ahoy)(opts)
  // TODO - do something to return an API like { electron, ssb, config, manifest }

  const {
    title,
    secretStack,
    plugins = [],
    config = Config('ssb'),
    // TODO check config
    // TODO if auto setting config, then check the plugins to see if socket is present!
    ui // TODO check is URL or file://
  } = opts

  if (!Array.isArray(plugins)) throw Error('ssb-ahoy: plugins must be an array')
  if (!ui) throw Error('ssb-ahoy: expects a ui')

  const state = {
    server: null,
    ui: null,
    quitting: false
  }

  ipcMain.handle('get-config', () => config)
  electron.app.on('before-quit', function (e) {
    state.quitting = true
    log('quitting')
  })

  electron.app.on('ready', () => {
    // TODO check this is used. I think this needs to be called in the UI windows?
    Menu()

    // ipcMain.on('ahoy:remote-log', (ev, args) => {
    //   const { title } = ev.sender.browserWindowOptions
    //   logger(title, ...args)
    // })
    // ipcMain.on('ahoy:remote-error', (ev, err) => {
    //   const { title } = ev.sender.browserWindowOptions
    //   logger(title + ' (error)', err)
    // })

    // TODO can we move this outside this onReady?
    electron.app.on('activate', ev => {
      if (state.ui) state.ui.show() // reopen the app when dock icon clicked on macOS
    })

    StartServer(StartUI)
  })

  function StartServer (cb) {
    if (state.server) throw Error('ahoy: you can only have one server at a time!')
    if (!config && !plugins) return cb() // because a UI-only based step

    log('starting Server')
    const shs = config.caps.shs
    const stack = secretStack({ caps: { shs } })
    plugins.forEach(plugin => stack.use(plugin))
    state.server = stack(config)

    const manifest = state.server.getManifest()
    config.manifest = manifest
    // TODO write a copy to join(config.path, 'manifest.json')

    // TODO ping the server to check it's all ready to go before launching UI
    cb()
  }

  function StartUI () {
    log('starting UI')

    state.ui = UI(ui, { title })
    state.ui.setSheetOffset(40)
    state.ui.on('close', ev => {
      if (process.platform === 'darwin') {
        if (!state.quitting) {
          ev.preventDefault()
          state.ui.hide()
        }
      } else {
        electron.app.quit()
      }
    })
  }
}
