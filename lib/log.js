const LABEL_PATTERN = /^\([a-zA-Z\s]+\)/
const LABEL_WIDTH = 10
const LABEL_PAD = ' '

module.exports = function log () {
  var content = arguments

  if (arguments.length === 1) {
    var match = arguments[0].match(LABEL_PATTERN)
    if (match && match[0].length < LABEL_WIDTH) {
      content = arguments[0].replace(
        match[0],
        match[0] + new Array(LABEL_WIDTH - match[0].length).fill(LABEL_PAD).join('')
      )
    }
  }

  console.log('# AHOY:', content)
}
