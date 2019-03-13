const pull = require('pull-stream')
const Abortable = require('pull-abortable')

module.exports = function getName (server) {
  return function (cb) {
    const through = Abortable()

    var name = null

    pull(
      server.messagesByType({
        type: 'about',
        reverse: true
      }),
      through,
      pull.filter(isSelfNaming),
      pull.drain(
        m => {
          through.abort()
          if (name) throw new Error('two names got through!!!')

          name = m.value.content.name
          cb(null, name)
        },
        () => {
          if (name === null) cb(null, null)
        }
      )
    )
  }

  function isSelfNaming (m) {
    if (m.value.author !== server.id) return false
    if (m.value.content.about !== server.id) return false

    if (typeof m.value.content.name !== 'string') return false
    if (m.value.content.name.length < 1) return false
    return true
  }
}
