# ssb-ahoy !

An onboarding mini-app - gets you all set up, and caught up on the gossip before you set out on your adventure

You currently need to be on the same network as another peer (this version has to start with local peer recplication)

## Example

```js
// index.js
const ahoy = require('ssb-ahoy')
const Config = require('ssb-config/inject')

const config = Config('ssb-test-account')
const plugins = [
  'ssb-private',
  'ssb-backlinks',
  'ssb-about',
  'ssb-query',
  'ssb-suggest'
]

ahoy({
  title: 'Patchbay',
  config,
  plugins,
  uiPath: './app.js', // entry point to your main app
  onReady: () => {
    console.log('welcome aboard')
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

### `ahoy(opts, onReady)`

`opts` *Object*
- `title` - *String* (optional) the title to be attached to the visible window
- `config` - *Object* valid config for starting and connecting to an `ssb-server`, see [ssb-config](www.github.com/ssbc/ssb-config). Must include keys
- `plugins` - *Array* (optional) a list of the names of plugins you'd like to get ahoy to run indexes of for you
- `uiPath` - *String* string which points to the ui entry point of your app
- `appDir` - *String* (optional) the relative path to your app root _from the ssb-ahoy module_. Generally just don't touch this, you don't want to know

`onReady`- a callback which is run after ahoy hands over to your main app. Is passed some state data, e.g. `windows` (ui, server)

## The voyage map

Note at the moment moment `ssb-ahoy` is running the main electron instance.
We can't seem to easily quit out of it and launch pour own e.g. patchbay, using that electron... which would seem more ideal.
Currently just hacking it so that `app.quit()` is not called, and patchbay uses ahoy's electron ...

- [ ] skip ssb-ahoy if already "set up"
  - [x] check I have a name
  - [ ] check I have an image
  - [ ] check I'm following people / have content?
  - [ ] check I'm being replicated (later after peer-invites)
- [ ] set your name / image
- [x] lets you follow peers on a local network
- [x] shows you progress of replication and indexing
- [x] let's your quit out and try jumping to the next app!
- [x] de-dups any double ups from developers adding plugins which ssb-ahoy is already using
- [x] get it working on Unix / Windows
  - [x] starts
  - [ ] builds working installers
- [ ] _ANY_ UI design + css !

Bonus:
- [ ] names next to the local peers keys
  - note that `lib/get-name` only looks for more recent self-set name. any more requires indexes
- [ ] only provide (next) button if know (based on `ssb-ebt` data) have all the data for all the feeds
- [x] split the replication into multiple stages


## Development

:warning: **WARNING** - because of limitations in electron, I've had to use `executeJavascript` which only takes strings.
In terms of requiring plugins, this has meant some kinda nasty hacks so that ssb-ahoy doesn't have to maintain plugins.

You are likely to have problems if you try to symlink this module into place.
I highly recommend temporarily cloning this repo into your `node_modules` to make for predictable development.
