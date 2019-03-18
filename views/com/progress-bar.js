const h = require('mutant/h')

module.exports = function Progress (current, target) {
  if (isNaN(current) || isNaN(target)) return
  if (current < 0 || target < 0) return

  const proportion = current / target
  const totalMB = Math.floor(target / 1024 / 1024) // 1 step = 1 MB
  const total = totalMB
  const done = Math.floor(proportion * total)

  const DONE = '■'
  const TODO = '□'
  const WIDTH = 40

  var bar = []

  for (var i = 1; i <= total; i++) {
    if (i <= done) bar.push(DONE)
    else bar.push(TODO)

    if (i % WIDTH === 0) bar.push('\n')
    else bar.push(' ')
  }

  return h('div', [
    h('pre', bar),
    `${totalMB} MB of messages replicated (${Math.floor(proportion * 100)}% processed)`
  ])
}
