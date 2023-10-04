// NOTE this is dummy code to minimally test the app.
// This file will generally be made through "bundling"

const app = document.getElementById('app')

const title = h('h1', 'Example Ahoy!')
const message = h('div', 'loading...')

app.appendChild(title)
app.appendChild(message)

// We use electron window functions to expose safe IPC call getConfig()
window.ahoy.getConfig()
  .then(config => {
    console.log('ssb config:', config)
    message.innerHTML = `
      <p>
        Current app path:
        <pre><code>  ${config.path}</code></pre>
      </p>
      <p>
        My feedId:
        <pre><code>  ${config.keys.id}</code></pre>
      </p>
    `
  })

function h (type, text) {
  const newEl = document.createElement(type)
  newEl.innerText = text

  return newEl
}
