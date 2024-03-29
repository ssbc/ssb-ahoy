import * as esbuild from 'esbuild'
import dirnameFix from 'esbuild-plugin-fileloc'

await esbuild.build({
  entryPoints: ['main.js'],
  bundle: true,
  platform: 'node',
  target: 'node16.15.0',
  external: [
    'electron' // shouldn't bundle
  ],
  plugins: [
    dirnameFix.filelocPlugin()
    // fixes __dirname refs used by node-gyp-build
    // see also: https://github.com/evanw/esbuild/issues/859
  ],
  outfile: 'main.bundle.js'
})
