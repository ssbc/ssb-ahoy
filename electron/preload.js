const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ahoy', {
  getConfig () {
    return ipcRenderer.invoke('get-config')
  }
})

// then in window
// window.ahoy.getConfig().then(config => {
//
// })
