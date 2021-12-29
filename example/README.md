# ssb-ahoy example app

## Notes

### Dependancies provided

`ssb-ahoy` provides versions of `electron`, `electron-builder` which are known to work with it.

You call each of them from scripts in your project's `package.json`

    - you can call these in package.json scripts


## Dev Notes

- not sure why this package.json requires `electron` as a dev-dependancy
    - could be the strange `ssb-ahoy` dependancy
    - having this here helps the postinstall script rebuild dependancies correctly

