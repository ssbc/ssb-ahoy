// see https://www.electron.build/configuration/configuration

// NOTE
// - this is a more optimized config which prunes un-needed files
// - see config.simple.js for something easier, but makes things a few MB bigger

const simple = require('./config.simple.js')

module.exports = {
  ...simple,

  files: fileRules([
    // sodium-native - drop un-needed prebuilds
    '!node_modules/sodium-native/{prebuilds/*, deps, test, binding.*, *.md}',
    'node_modules/sodium-native/prebuilds/${platform}-${arch}/*', // eslint-disable-line

    // leveldown - drop un-needed prebuilds
    '!node_modules/leveldown/{prebuilds/*, deps, binding.*, *.md}',
    'node_modules/leveldown/prebuilds/${platform}-${arch}/*', // eslint-disable-line

    // es-abstract
    '!node_modules/es-abstract/',
    'node_modules/es-abstract/helpers/getOwnPropertyDescriptor.js'
    // WARNING - you may have to include more files, check your installer launches!
  ])
}

function fileRules (rules) {
  // defaults from electron-builder
  //   https://www.electron.build/configuration/contents#files
  const defaults = [
    '**/*',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
    '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
    '!**/node_modules/*.d.ts',
    '!**/node_modules/.bin',
    '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
    '!.editorconfig',
    '!**/._*',
    '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
    '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
    '!**/{appveyor.yml,.travis.yml,circle.yml}',
    '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}'
  ]

  return [...defaults, ...rules]
}
