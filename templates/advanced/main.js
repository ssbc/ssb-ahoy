/* eslint-disable camelcase */

const { join } = require('path')
const ahoy = require('ssb-ahoy')

// WARNING monkey patch! --------------------------------------
const na = require('sodium-native')
na.sodium_malloc = function sodium_malloc_monkey_patched (n) {
  return Buffer.alloc(n)
}
// Electron > 20.3.8 breaks a napi method that `sodium_malloc`
// depends on to create external buffers. (see v8 memory cage)
//
// This crashes electron when called by various libraries, so
// we monkey-patch this particular function.
// ------------------------------------------------------------

ahoy(
  `file://${join(__dirname, 'ui', 'index.html')}`,
  {
    title: 'example-ahoy',
    plugins: [
      require('ssb-db2'),
      require('ssb-hyper-blobs')
    ],
    config: {
      // path: join(__dirname, 'dev-data')
    }
  },
  (err, ssb) => {
    if (err) throw err

    console.log('ahoy started', ssb.id)

    // publish a message!
    const content = {
      type: 'success',
      time: new Date().toString()
    }
    ssb.db.create({ content }, (err, msg) => {
      if (err) throw err
      console.log(JSON.stringify(msg, null, 2))
    })
  }
)
