/* eslint-disable no-template-curly-in-string */

// NOTE
// - this is a heavily optimized config which prunes un-needed files
//   - simple: 106MB
//   - advanced: 88MB (and faster startup because of bundle)

const fs = require('fs')
const path = require('path')

// https://www.electron.build/configuration/configuration
module.exports = {
  appId: 'com.advanced-ahoy.app',
  directories: {
    output: 'installers'
  },

  /* ADVANDCED SECTION: */

  /* Only include needed files */
  // we ruthlessly cut all files covered by our main.bundle.js (from esbuild)
  files: [
    // NOTE that we have to include ! (not) rules in files, otherwise
    // electron-builder auto-adds **/*  (add everything!)
    '!builder',
    '!installers',
    '!node_modules',

    /* UI files (referenced by main.bundle.js) */
    'ui',

    /* main process */
    'main.bundle.js',

    // native module bindings for main process
    'node_modules/node-gyp-build/*.js',

    'node_modules/sodium-chloride/*.js',

    'node_modules/sodium-native/index.js',
    'node_modules/sodium-native/prebuilds/${platform}-${arch}/*',

    'node_modules/leveldown/*.js',
    'node_modules/leveldown/prebuilds/${platform}-${arch}/*',

    /* ssb-ahoy ui-window dependency */
    'node_modules/ssb-ahoy/electron/preload.js'
  ],
  // NOTE how to figure out what's needed:
  //   1. run `npm run release`
  //   2. try to launch the output (see dist/installers/*.AppImage etc)
  //   3. read the errors about what's missing and add it above
  // asar: false,
  // disable asar bundling to be able to see files easier

  electronLanguages: ['en-GB', 'pt-BR', 'es'],
  // drop all the locales not needed to save space
  // To see options: ls installers/linux/unpacked/locales

  /* delete files from the pack! */
  afterPack (context) {
    // const ls = fs.readdirSync(context.appOutDir)
    // console.log(ls)
  },

  publish: [{
    provider: 'github',
    owner: 'ahau-nz',
    repo: 'ahau',
    releaseType: 'release'
  }],

  ...windows(),
  ...linux(),
  ...mac()
}

function windows () {
  return {
    win: {
      icon: 'builder/win/icon.ico'

      /* Code Signing */
      // publisherName: ['Āhau NZ Limited'],
      // WARNING - this name must *exactly* match the subject/ "issued to" field on the Signing Certificate
      // otherwise in future if this name changes, auto-updating will fail D:

      // certificateSubjectName: 'Āhau NZ Limited', // The name of the subject of the signing certificate
      // NOTE - this field worked for code signing certificate, but not the EV signing
      // certificateSha1: 'A5F49ED3D5EBBCA6EE093BF2A8AA93DA36BDBF56'
      // This is a way to be VERY specific about the exact certificate used. This worked well with EV signing cert.
    },
    nsis: {
      artifactName: '${name}-Windows-${version}.${ext}', // eslint-disable-line
      installerIcon: 'builder/win/setup-icon.ico',
      include: 'builder/win/add-missing-dll.nsh' // fixes missing VCRUNTIME140.dll
      // source: https://github.com/sodium-friends/sodium-native/issues/100
    }
  }
}

function mac () {
  // N = this settings requires for Apple notarization
  // https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

  return {
    mac: {
      category: 'public.app-category.social-networking',
      icon: 'builder/mac/icon.icns',
      hardenedRuntime: true, // N
      gatekeeperAssess: false // N
    },
    dmg: {
      artifactName: '${name}-Mac-${version}.${ext}',
      background: 'builder/mac/background.png',
      icon: 'builder/mac/dmg-icon.icns',
      sign: false // N
    },
    /* Code Signing */
    afterSign: 'builder/mac/notarize.js' // N
  }
}

function linux () {
  return {
    linux: {
      category: 'Network',
      target: 'AppImage'
    },
    appImage: {
      artifactName: '${name}-Linux_${arch}.${ext}'
    }
  }
}
