# ssb-ahoy !

A simple module for getting electron-based scuttlebutt apps up and running.

Builds on top of:
- `electron@18`
- `secret-stack@6`

## Getting started 

```js
// index.js
const ahoy = require('ssb-ahoy')
const path = require('path')

ahoy(
  'http://localhost:8080', // dev-server for UI
  {
    plugins: [
      require('ssb-db'),
      require('ssb-backlinks')
    ]
  },
  (err, ssb) => {
    if (err) throw err

    console.log('ahoy started', ssb.id)
  }
)
```

```json
// package.json
{
  "scripts": {
    "start": "electron index.js"
  }
}
```

## API

### `ahoy(url, opts, cb)`

- `url` *String* - a url to load the app UI from
  - can start with
      - `http:`, `https:` - great for local dev-servers
      - `file:` - useful when you bundle ui for production, electron fetches directly from file system
          - e.g. `file://${path.join(__dirname, 'dist/index.html)}'
  - required

- `opts` *Object* with properties:
    - `opts.title` *String* - the title of your app
        - will be the title of the app window
        - default: `'hello_world'`
    - `opts.plugins` *[Plugin]* - an array of `secret-stack` plugins
        - default: `[]`
    - `opts.config` *Object* - over-rides what's passed to `secret-stack` + `plugins` on launch
        - `opts.config.path` *String* - location your database + secret will be installed
            - default: `\${envPaths.data}/ssb-ahoy/dev/\${format(opts.title)}` 
        - generally defaults follow `ssb-config/defaults.js`

- `cb` *function* callback which is run once ssb and electron have started up


### `ahoy(url, opts) => Promise`

Convenience method which is a `promisify`'d version of the last method.


## Example

see `example/` folder for a simple example application.


## TODO

- [ ] example
    - [ ] add `electron-builder`
    - [ ] see if can remove `electron` as a dependancy of projects using ahoy

- [ ] make noderify'able


