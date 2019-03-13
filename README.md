# ssb-ahoy !

An onboarding mini-app - gets you all set up, and caught up on the gossip before you set out on your adventure

If you want to take this repo for a spin, run `npm start` and you'll get the mini-app by itself, and an identity set up in `~/.ahoy-test`.
You currently need to be on the same network as another peer (this version has to start with local peer recplication)

## Example

```js
// ahoy.js

const ahoy = require('ssb-ahoy')
const Config = require('ssb-config/inject')

const config = Config('ssb', {
  friends: { hops: 2 }
})
const plugins = ['ssb-private', 'ssb-backlinks', 'ssb-about', 'ssb-query', 'ssb-suggest']

ahoy(config, plugins)
```

```json
// package.json
{
  "scripts": {
    "start": "electron ahoy.js && electron index.js"
  }
}
```

`ssb-ahoy` closes with exit code `0` so will go on to run subsequent bash commands

**NOTE**: if you set `AHOY=true` then `ssb-ahoy` will open up regardless of whether you're "set up"

## API

### `ahoy(config, plugins)`

- `config` - valid config for starting and connecting to an `ssb-server`, see [ssb-config](www.github.com/ssbc/ssb-config). Must include keys
- `plugins` - an Array of the names of plugins you'd like to get ahoy to run indexes of for you

None of these arguments are optional.


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
- [ ] _ANY_ UI design + css !

Bonus:
- [ ] names next to the local peers keys
  - note that `lib/get-name` only looks for more recent self-set name. any more requires indexes
- [ ] only provide (next) button if know (based on `ssb-ebt` data) have all the data for all the feeds
- [ ] split the replication into multiple stages?
