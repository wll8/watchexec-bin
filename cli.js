#!/usr/bin/env node

void(async () => {
  const { getBin } = require(`./index.js`)
  const bin = await getBin()
  require(`child_process`).spawn(bin, process.argv.slice(2), {
    stdio: `inherit`,
  })
})()