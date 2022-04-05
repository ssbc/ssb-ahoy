const { join } = require('path')
const ahoy = require('ssb-ahoy')

ahoy(
  `file://${join(__dirname, 'dist', 'index.html')}`,
  {
    title: 'example-ahoy',
    plugins: [
      require('ssb-db')
    ],
    config: {
      // path: join(__dirname, 'dev-data')
    }


  },
  (err, ssb) => {
    if (err) throw err

    console.log('ahoy started', ssb.id)
  }
)
