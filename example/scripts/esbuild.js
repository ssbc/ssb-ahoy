const esbuild = require('esbuild')
const path = require('path')

const config = {
  bundle: true,
  platform: 'node',
  target: 'node16.13.2',

  entryPoints: [
    path.join(__dirname, '../index.js')
    // path.resolve('node_modules/ssb-ahoy/electron/preload.js')
  ],
  outdir: path.join(__dirname, '../dist/main'),

  external: [
    'electron',
    'sodium-native',
    'leveldown'
  ]
}

esbuild.buildSync(config)
console.log('done!')
