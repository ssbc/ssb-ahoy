const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  hello: (thing) => console.log(thing)
})

// then in window
// window.api.hello('hi world')
