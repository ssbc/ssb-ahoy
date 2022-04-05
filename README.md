# ssb-ahoy !

Simple app for getting an electron-based scuttlebutt app up and running!

Builds over:
- `electron@18`
- `secret-stack@6`

## Getting started 

```js
// index.js
const ahoy = require('ssb-ahoy')
const Config = require('ssb-config/inject')

ahoy(
  plugins: [
    require('ssb-db'),
    require('ssb-backlinks')
  ],
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

- `url` *String*
    - a url to load the app UI from
    - can start with `http:`, `https:`, or `file:` (for fetching a file directly from the file system)
- `opts` *Object* with properties:
    - `opts.title` - *String* the title of your app
        - will be the title of the app window
        - default: `'hello_world'`
    - `opts.plugins` - *[Plugin]* an array of `secret-stack` plugins
        - default: `[]`
    - `opts.config` - *Object* config over-wrides which `secret-stack` and `plugins` will be launched with
        - `opts.config.path` - *String* location your database + secret will be installed
            - default: `\${envPaths.data}/ssb-ahoy/dev/\${format(opts.title)}` 
        - generally defaults follow `ssb-config/defaults.js`
- `cb` *function* callback which is run once ssb and electron have started up


### `ahoy(url, opts) => Promise`

Convenience method which is a `promisify`'d version of the last method.


## TODO

- [ ] example
    - [ ] add `electron-builder`
    - [ ] see if can remove `electron` as a dependancy of projects using ahoy

- [ ] make noderify'able


