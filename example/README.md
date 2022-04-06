# example-ahoy

This example app shows you a minimal setup covering:
- package.json scripts
- electron-builder config
    - a good starter config (builder/config.js)
    - a directory structure for collecting OS specific assets for building (builder/win/ for window s etc)

What this project doesn't show is how to set up a UI framework
and bundle that to produce the contents of`dist/` folder.

## Setup

To run this in development mode, clone this repo down, then :

```bash
$ cd ssb-ahoy/example
$ npm i
$ npm run start
```

To build an installer/ executable :

```
$ npm run release
```


## Notes

It might be worth looking into bundling `index.js` to try and reduce file size and
increase startup speed.

Have looked into [esbuild](https://esbuild.github.io), but have had trouble
with the electron preload script in `ssb-ahoy`

