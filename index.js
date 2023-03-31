const FS = require(`fs`)
const PATH = require(`path`)
const { spawn } = require(`child_process`)
const decompress = require(`decompress`)
const { binShim, getBinFile } = require(`cur-env-bin`)
const util = require(`./util.js`)

async function getBin() {
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

/**
 * 使用 watchexec 创建文件监听器
 * @see https://github.com/watchexec/watchexec/tree/main/crates/cli
 */
function watchFile({bin, arg, cwd}) {
  const emitEventsTo = `environment` // json-stdin json-file environment
  const bus = new util.PubSub()
  const argNew = [
    ...arg,
    `--emit-events-to=${emitEventsTo}`,
    util.handlePathSpaces(process.execPath),
    util.handlePathSpaces(`${__dirname}/watchexecEvent.js`),
    emitEventsTo,
  ]
  const watchexec = spawn(bin, argNew, {
    cwd,
    stdio: [],
  })
  watchexec.stdout.on('data', data => {
    const str = String(data)
    const json = JSON.parse(str)
    bus.emit(`change`, json)
  })
  watchexec.stderr.on('data', data => {
    bus.emit(`error`, String(data).trim())
  })
  watchexec.on('close', code => {
    bus.emit(`close`)
  })
  return bus
}

/**
 * 简单化处理文件变更为 -- remove upload scan
 * 创建 created
 * 变更 changed
 * 删除 removed
 * 重命名 renamed
 *  -- 由于可以批量重命名, 暂无方法判断是谁重命名为谁
 *  -- 某些实现是先删除, 后添加 
 *  -- 触发重新扫描功能, 扫描本批次所有文件
 * 给一个文件路径, 读取其类型
 * 如果文件存在, 变是变更, 如果不存在, 就是删除
 * 
 * 注: upload dir 仅表示创建文件夹
 */
async function simpleEvent({root, path, type}) {
  path = PATH.isAbsolute(path) ? path : `${root}/${path}`
  return new Promise((resolve) => {
    let obj = {
      path,
      action: ``,
      type: ``,
    }
    // 是否可见, 不可见是为删除
    FS.access(path, FS.constants.F_OK, err => {
      if(err) {
        obj.action = `remove`
        return resolve(obj) // 删除
      } else {
        // 是否可读
        FS.access(path, FS.constants.R_OK, err => {
          if(err) {
            obj.action = ``
            return resolve(obj) // 文件不可读时跳过
          } else {
            FS.stat(path, (err, stats) => {
              if(err) {
                obj.action = ``
                return resolve(obj) // 文件不可读时跳过
              } else {
                obj.action = `upload`
                stats.isFile() && (obj.type = `file`)
                stats.isDirectory() && (obj.type = `dir`)
                // 由于无法正确判断文件夹变更(重命名), 所以所以变更都进行目录扫描
                if(obj.type === `dir`) {
                  obj.action = `scan`
                }
                return resolve(obj)
              }
            })
          }
        })
      }
    })
  })
}

module.exports = {
  simpleEvent,
  watchFile,
  getBin,
}