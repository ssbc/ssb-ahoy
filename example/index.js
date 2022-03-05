const { join } = require('path')
const ahoy = require('ssb-ahoy')

ahoy(
  {
    title: 'example-ahoy',
    secretStack: require('secret-stack'),
    plugins: [
      require('ssb-db')
    ],
    ui: `file://${join(__dirname, 'dist', 'index.html')}`
  },
  (err, instance) => {
    if (err) throw err

    console.log(instance)

    setTimeout(instance.close, 1000)
  }
)
