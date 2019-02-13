const defaultMenu = require('electron-default-menu')
const electron = require('electron')

module.exports = function installMenu () {
  var menu = defaultMenu(electron.app, electron.shell)
  var view = menu.find(x => x.label === 'View')
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
  if (process.platform === 'darwin') {
    var win = menu.find(x => x.label === 'Window')
    win.submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close', label: 'Close' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate(menu))
}
