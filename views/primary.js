const Config = require('ssb-config/inject')
const Client = require('ssb-client')
const { h, Value } = require('mutant')
const { ipcRenderer } = require('electron')

const appName = process.env.ssb_appname || process.env.SSB_APPNAME || 'ssb'
const config = Config(appName, {
  friends: { hops: 1 }
})

var app = Value(h('h1', 'Loading...'))
document.body.appendChild(h('App', app))

Client(config.keys, config, (err, server) => {
  if (err) return console.error(err)

  server.whoami((err, data) => {
    if (err) console.error(err)

    app.set(h('div', [
      h('div', 'whoami'),
      h('pre', JSON.stringify(data, null, 2))
    ]))

    setTimeout(() => {
      console.log('client: SENDING >> server-close')
      ipcRenderer.send('server-close')
    }, 1e3)
  })

  ipcRenderer.on('server-closed', () => {
    console.log('client: RECEIVED << server-closed, closing client')
    server.close()
  })

  // const follow = {
  //   type: 'contact',
  //   contact: '@RiurK/6I17hTzicZcfL++3evc5dCKRhPmpnrGlqMP28=.ed25519',
  //   following: true
  // }
  // server.publish(follow, (err, msg) => {
  //   if (err) return console.error(err)

  //   app.set(h('div', [
  //     h('div', 'Following published'),
  //     h('pre', JSON.stringify(msg, null, 2))
  //   ]))

  //   const invite = 'pub.mixmix.io:8008:@uRECWB4KIeKoNMis2UYWyB2aQPvWmS3OePQvBj2zClg=.ed25519~CLqLHER7fY0CQdZJUjBXmeQxrJx0tBUFVUN8SdVZv+4='
  //   server.invite.accept(invite, (err, data) => {
  //     if (err) console.error(err)
  //     setTimeout(() => ipcRenderer.send('server-close'), 30e3)
  //   })
  // })
})
