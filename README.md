# ssb-ahoy !

An onboarding mini-app - gets you all set up, and caught up on the gossip before you set out on your adventure

You currently need to be on the same network as another peer (this version has to start with local peer recplication)

## Requirements

You must have the following modules installed in your application:
- `secret-stack` (`^6.2.1`)
- `ssb-db`
- `ssb-master`
- `ssb-unix-socket` + `ssb-no-auth`

NOTE we no longer use `ssb-server` (this is just `secret-stack` + `ssb-db` + some CLI tools)

## Example usage

```js
// index.js
const ahoy = require('ssb-ahoy')
const Config = require('ssb-config/inject')

const plugins = [
  'ssb-conn',
  'ssb-replicate',
  'ssb-friends',
  'ssb-invite',
  'ssb-private',
  'ssb-backlinks',
  'ssb-about',
  'ssb-query',
  'ssb-suggest'
]

ahoy({
  title: 'Patchbay',
  plugins,
  appPath: './app.js', // entry point to your main app
  onReady: (state) => {
    console.log('welcome aboard')
    console.log(state)
  }
})
```

```json
// package.json
{
  "scripts": {
    "start": "electron index.js"
  }
}
```

**NOTE**: if you set `AHOY=true` then `ssb-ahoy` will open up regardless of whether you're "set up"

## API

### `ahoy(opts)`

`opts` *Object* with properties:
- `plugins` - *[String]* an array of `ssb-server` plugins names (as strings) you'd like ahoy to run for you
- `appURL` | `appPath` - *String* (only one of these)
  - `appURL` - points to a URL for your app. This is really useful for things like webpack dev-servers (e.g. can be `http://localhost:8080` or `\`file://${__dirname}/index.html\``)
  - `appPath` - the relative path to the entry points of your app, from the root of your app repo. The entry point is expected to export function that accepts a copy of the `config` (so it can connect to the server that's been started!) and is expected to handle attaching some UI to the page.
- `title` - *String* (optional) the title to be attached to the visible window
- `config` - *Object* (optional) if this is supplied, `ssb-ahoy`'s config selector + editor will be skipped and you'll be jumped straight to launching your app. Must be valid config for starting and connecting to an `ssb-server` and include `config.keys` (see also: [ssb-config](www.github.com/ssbc/ssb-config))
- `appDir` - *String* (optional) the relative path to your app root _**from** the ssb-ahoy module_. Generally just don't touch this, it's only really used when symlinking `ssb-ahoy` in ... you don't want to know :(
- `onReady`- *Function* (optional) a callback which is run after ahoy hands over to your main app. Is passed some state data, e.g. `config`, `windows` (ui, server)

## The voyage map

Note at the moment moment `ssb-ahoy` is running the main electron instance.
We can't seem to easily quit out of it and launch pour own e.g. patchbay, using that electron... which would seem more ideal.
Currently just hacking it so that `app.quit()` is not called, and patchbay uses ahoy's electron ...

- [x] start with alternative configs
  - [x] find or create new identities
  - [x] see and edit `config` for an identity
  - [x] block users from changing `caps.sign` if it's already set

- [ ] option to skip skip ssb-ahoy
  - [ ] based on some setting/ config somewhere
  - [ ] based on account state (name, image, follows, seq)

- [ ] set your name / image (if applicable)

- [ ] first time replication + indexing (currently disabled)
  - [x] lets you follow peers on a local network
  - [x] shows you progress of replication and indexing
  - [x] let's your quit out and try jumping to the next app!
  - [x] get it working on Unix / Windows
    - [x] starts
  - [ ] builds working installers
  - [ ] _ANY_ UI design + css !
  - bonuses: 
    - [ ] names next to the local peers keys
      - note that `lib/get-name` only looks for more recent self-set name. any more requires indexes
    - [ ] only provide (next) button if know (based on `ssb-ebt` data) have all the data for all the feeds
    - [x] split the replication into multiple stages

Bonus:


## Development

:warning: **WARNING** - because of limitations in electron, I've had to use `executeJavascript` which only takes strings.
In terms of requiring plugins, this has meant some kinda nasty hacks so that ssb-ahoy doesn't have to maintain plugins.

You are likely to have problems if you try to symlink this module into place.
The solution is to set the `opts.appDir`. e.g. if I have `~/projects/patchbay` and `~/projects/ssb-ahoy`, then after linking ssb-ahoy into patchbay, I would set `appDir: '../patchbay'`

