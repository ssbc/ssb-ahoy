// see https://www.electron.build/configuration/configuration

// NOTE
// - this is a more optimized config which prunes un-needed files
// - see config.simple.js for something easier, but makes things a few MB bigger

const simple = require('./config.simple.js')
const fs = require('fs')
const path = require('path')

module.exports = {
  ...simple,

  files: [
    '!builder',
    '!installers',
    '!node_modules',

    /* electron main process */
    'main.bundle.js',

    /* native bindings  (dependencies of main.bundle.js) */
    'node_modules/node-gyp-build/index.js',

    'node_modules/sodium-chloride/index.js',

    'node_modules/sodium-native/index.js',
    'node_modules/sodium-native/prebuilds/${platform}-${arch}/*', // eslint-disable-line

    'node_modules/leveldown/index.js',
    'node_modules/leveldown/prebuilds/${platform}-${arch}/*', // eslint-disable-line

    /* UI files (referenced by main.bundle.js) */
    'ui',

    /* ssb-ahoy ui-window dependency */
    'node_modules/ssb-ahoy/electron/preload.js'
  ],

  afterPack (context) {
    fs.rmSync(path.join(context.appOutDir, 'LICENSE.electron.txt'))
    fs.rmSync(path.join(context.appOutDir, 'LICENSES.chromium.html'))
    // const ls = fs.readdirSync(context.appOutDir)
    // console.log(ls)
  }
}

// function fileRules (rules) {
//   // defaults from electron-builder
//   //   https://www.electron.build/configuration/contents#files
//   const defaults = [
//     '**/*',
//     '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
//     '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
//     '!**/node_modules/*.d.ts',
//     '!**/node_modules/.bin',
//     '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
//     '!.editorconfig',
//     '!**/._*',
//     '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
//     '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
//     '!**/{appveyor.yml,.travis.yml,circle.yml}',
//     '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
//   ]

//   return [...defaults, ...rules]
// }
