// see https://www.electron.build/configuration/configuration

module.exports = {
  appId: 'com.example-ahoy.app',

  directories: {
    output: 'dist/installers'
  },

  // asarUnpack: [
  //   './node_modules/sodium-native/**'
  //   // needed for sodium-native/prebuilds trim, not sure why
  // ],
  // files: [
  //   // sodium-native: only include needed prebuilds
  //   'node_modules/sodium-native/prebuilds/${platform}-${arch}/*', // eslint-disable-line
  // ],

  /* Linux */
  linux: {
    category: 'Network',
    target: 'AppImage'
  },
  appImage: {
    artifactName: '${name}-Linux-${version}-${arch}.${ext}' // eslint-disable-line
  },

  /* Mac */
  mac: {
    category: 'public.app-category.social-networking'
  },
  dmg: {
    artifactName: '${name}-Mac-${version}.${ext}', // eslint-disable-line
  },

  /* Windows */
  win: {
  },
  nsis: {
    artifactName: '${name}-Windows-${version}.${ext}', // eslint-disable-line
    include: 'build/win/add-missing-dll.nsh' // fixes missing VCRUNTIME140.dll
    // source: https://github.com/sodium-friends/sodium-native/issues/100
  }
}
