void(async () => {
  const { execSync } = require(`child_process`)
  const { getBin } = require(`./index.js`);
  const bin = await getBin();
  execSync(`${bin} --watch ./ echo change`, {stdio: `inherit`})
})()