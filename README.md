# ssb-ahoy !

An onboarding mini-app - gets you all set up, and caught up on the gossip before you set out on your adventure

## Example

```js
const ahoy = require('ssb-ahoy')
const Config = require('ssb-config/inject')

const config = Config('ssb', {
  friends: { hops: 2 }
})
const plugins = ['ssb-private', 'ssb-backlinks', 'ssb-about', 'ssb-query', 'ssb-suggest']

ahoy(config, plugins, () => {
  console.log('Ready to set sail!')

  // launch your main app in here!
})
```

If you want to take this repo for a spin, run `npm start` and you'll get the mini-app by itself, and an identity set up in `~/.ahoy-test`.
You currently need to be on the same network as another peer.

## The voyage map

- [ ] gets you set up with a name + image before setting sail
- [x] lets you follow peers on a local network
- [x] shows you progress of replication and indexing
- [x] let's your quit out and try jumping to the next app!
- [ ] names next to the local peers keys ?!
- [ ] _ANY_ UI design + css !
- [ ] only provide (next) button if know (based on `ssb-ebt` data) have all the data for all the feeds
- [ ] split the replication into multiple stages?
- [ ] detect if an identity exists already and is well set up?
