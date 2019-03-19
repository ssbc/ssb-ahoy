const h = require('mutant/h')

module.exports = function Progress (done, target) {
  if (isNaN(done) || isNaN(target)) return
  if (done < 0 || target < 0) return

  const DONE = '■'
  const TODO = '□'
  const WIDTH = 40

  var bar = []

  for (var i = 1; i <= target; i++) {
    if (i <= done) bar.push(DONE)
    else bar.push(TODO)

    if (i % WIDTH === 0) bar.push('\n')
    else bar.push(' ')
  }

  return h('div', [
    h('pre', bar)
  ])
}
