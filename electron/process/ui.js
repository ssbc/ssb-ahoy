const electron = require('electron')
const WindowState = require('electron-window-state')
const path = require('path')

module.exports = function uiWindow (ui, opts = {}) {
  const windowState = WindowState({
    defaultWidth: 1024,
    defaultHeight: 768
  })

  opts = Object.assign(
    {
      title: 'ui',
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
      // icon: '../assets/icon.png', // may not be needed
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js')
      }
    },
    opts
  )

  const win = new electron.BrowserWindow(opts)
  windowState.manage(win)

  win.webContents.on('will-navigate', (ev, url) => {
    ev.preventDefault()
    electron.shell.openExternal(url)
  })

  win.webContents.on('new-window', (ev, url) => {
    ev.preventDefault()
    electron.shell.openExternal(url)
  })

  win.loadURL(ui)

  return win
}
