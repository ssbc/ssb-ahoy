import * as esbuild from 'esbuild'
import dirnameFix from 'esbuild-plugin-fileloc'

await esbuild.build({
  entryPoints: ['main.js'],
  bundle: true,
  platform: 'node',
  target: 'node18.16.1',
  external: [
    'electron' // shouldn't bundle
  ],
  plugins: [
    dirnameFix.filelocPlugin()
    // fixes __dirname refs used by node-gyp-build
  ],
  outfile: 'main.bundle.js'
})
