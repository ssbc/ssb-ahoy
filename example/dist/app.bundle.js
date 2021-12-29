// NOTE this is dummy code to minimally test the app.
// It's expected this file will be generated through bundling (WebPack etc.)

const app = document.getElementById('app')

const title = document.createElement('h1')
title.innerText = 'Example Ahoy!'
app.appendChild(title)

const message = document.createElement('div')
message.innerText = 'loading...'
app.appendChild(message)

// NOTE - if the UI is using ssb-config, how do we know what config to run
// - [x] fine if we bake in the config
// - [ ] not great if we want to change the location
//     - could use electron-rpc methods to ask electron how/ where to connect
//     - could use electron window to make some functions/ variables available on the window!

window.ahoy.getConfig()
  .then(config => {
    message.innerText = `Your scuttlebutt id: ${config.keys.id}`
  })
