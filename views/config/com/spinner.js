const { h } = require('mutant')

function Spinner (text) {
  return h('Spinner', [
    h('i.fa.fa-spinner.fa-pulse'),
    h('span', text)
  ])
}

Spinner.style = `
  Spinner {
    i.fa {
      margin-left: .5rem
    }
  }
`

module.exports = Spinner
