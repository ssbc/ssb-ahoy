// NOTE this is dummy code to minimally test the app.
// It's expected this file will be generated through bundling

const app = document.getElementById('app')

async function start () {
  const title = h('h1', 'Example Ahoy!')
  const message = h('div', 'loading...')

  app.appendChild(title)
  app.appendChild(message)

  // We use electron window functions to expose safe IPC call getConfig()
  const config = await window.ahoy.getConfig()
  console.log('ssb config:', config)
  message.innerHTML = `Your scuttlebutt id: <code>${config.keys.id}</code>`
}
start()

function h (type, text) {
  const newEl = document.createElement(type)
  newEl.innerText = text

  return newEl
}
