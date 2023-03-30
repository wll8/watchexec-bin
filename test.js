void(async () => {
  const { getBin, watchFile, simpleEvent } = require(`./index.js`);
  const bin = await getBin();
  console.log(`文件监听中...`)
  const bus = watchFile({
    bin,
    arg: [
      `--watch`,
      `./`,
      `--postpone`, // 不先运行程序, 应收到事件后再运行
      `--no-vcs-ignore`,
      `--no-project-ignore`,
      `--no-global-ignore`,
      `--no-default-ignore`,
    ],
    cwd: __dirname,
  })
  bus.on(`change`, async (data) => {
    console.log(`change`, data)
    const list = await Promise.all(data.pathList.map(path => {
      return simpleEvent({
        root: data.COMMON_PATH,
        type: data.type,
        path: path,
      })
    })).catch(err => {
      console.log(`err`, err)
    })
    console.log(`list`, list)
  })
})()