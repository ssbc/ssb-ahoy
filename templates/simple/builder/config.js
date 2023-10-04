/* eslint-disable no-template-curly-in-string */

// https://www.electron.build/configuration/configuration
module.exports = {
  appId: 'com.simple-ahoy.app',
  directories: {
    output: 'installers'
  },

  /* Linux */
  linux: {
    category: 'Network',
    target: 'AppImage'
  },
  appImage: {
    artifactName: '${name}-Linux_${arch}.${ext}'
    // we drop the version for Linux so AppImage can be dropped in place
  },

  /* Mac */
  mac: {
    category: 'public.app-category.social-networking'
  },
  dmg: {
    artifactName: '${name}-Mac_${version}.${ext}'
  },

  /* Windows */
  win: {
  },
  nsis: {
    artifactName: '${name}-Windows_${version}.${ext}'
  }
}
