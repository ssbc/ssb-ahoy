const defaultMenu = require('electron-default-menu')
const electron = require('electron')

module.exports = function installMenu () {
  const menu = defaultMenu(electron.app, electron.shell)

  const view = menu.find(x => x.label === 'View')
  view.submenu = [
    { role: 'reload' },
    { role: 'toggledevtools' },
    { type: 'separator' }, // ---
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' }, // ---
    { role: 'togglefullscreen' }
  ]

  const win = menu.find(x => x.label === 'Window')
  if (process.platform === 'darwin') {
    win.submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      // { role: 'close', label: 'Close' },
      { role: 'quit' },
      { type: 'separator' },
      { role: 'front' }
    ]
  } else {
    win.submenu = [
      { role: 'minimize' },
      { role: 'quit' }
    ]
  }

  electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(menu))
}
