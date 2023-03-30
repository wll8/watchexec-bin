Automatically fetches the watchexec binary for the current platform.

Supports communicating with nodejs to get details of current changes.

## Why

- [nodemon](https://github.com/remy/nodemon) seems to be only for files, not for directory changes
- [chokidar](https://github.com/paulmillr/chokidar) causes the parent directory to be occupied and cannot change the name

## Use

command Line

```sh
# install
npm i -g @wll8/watchexec-bin

# run
watchexec --watch ./ echo change
```

nodejs

```js
const { execSync } = require(`child_process`)
const { getBin } = require(`@wll8/watchexec-bin`)
const bin = await getBin()
execSync(`${bin} --watch ./ echo change`, {stdio: `inherit`})
```

## license

MIT
