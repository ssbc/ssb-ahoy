const { join } = require('path')
const ahoy = require('ssb-ahoy')

ahoy(
  `file://${join(__dirname, 'ui', 'index.html')}`, // UI src
  {
    title: 'simple-ahoy',
    plugins: [
      require('ssb-db2')
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
