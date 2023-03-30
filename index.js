async function getBin() {
  const decompress = require(`decompress`);
  const { binShim, getBinFile } = require(`cur-env-bin`);
  const bin = await binShim({
    cwd: __dirname,
    owner: `watchexec`,
    repo: `watchexec`,
    fileListFn: async (github) => github.byTag(`v1.22.2`),
    async binFileFn({ file, saveDir, downloadPath }) {
      let bin = undefined
      const decompressDir = `${saveDir}/file`;
      await decompress(downloadPath, decompressDir, { strip: 1 });
      bin = getBinFile({ dir: decompressDir, name: `watchexec` });
      if(bin === undefined) {
        throw new Error([
          ``,
          `An error occurred while processing the ${downloadPath} file.`,
          ``,
        ].join(`\n`))
      }
      return bin
    },
  }).catch(err => {
    process.stderr.write(`${String(err)}\n`)
  })
  return bin
}

module.exports = {
  getBin,
}