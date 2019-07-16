const h = require('mutant/h')
const fontAwesome = require('require-style')('font-awesome')

// polyfills
require('setimmediate')

const State = require('./state')
const App = require('./app')
const componentCSS = require('../../lib/component-css')

module.exports = function (config) {
  // no config expected in this step

  const state = State(config)
  const app = App(state, config)

  document.body.appendChild(app)

  document.head.appendChild(h('style', fontAwesome))
  document.head.appendChild(h('style', componentCSS(App)))
}
