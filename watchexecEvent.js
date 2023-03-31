/**

action
  add
  remove
  change

type
  file
  dir
  link

  */

const map = {
  'json-file'(cb){
    const file = process.env.WATCHEXEC_EVENTS_FILE
    const str = require(`fs`).readFileSync(file, `utf-8`).trim()
    const list = handleJsonStr(str)
    cb(list)
  },
  'json-stdin'(cb) {
    process.stdin.on(`data`, data => {
      const str = String(data).trim()
      const list = handleJsonStr(str)
      cb(list)
    })

  },
  /**
  https://man.archlinux.org/man/community/watchexec/watchexec.1.en#emit

  $WATCHEXEC_COMMON_PATH is set to the longest common path of all of the below variables, and so should be prepended to each path to obtain the full/real path. Then:

  - $WATCHEXEC_CREATED_PATH is set when files/folders were created
  - $WATCHEXEC_REMOVED_PATH is set when files/folders were removed
  - $WATCHEXEC_RENAMED_PATH is set when files/folders were renamed
  - $WATCHEXEC_WRITTEN_PATH is set when files/folders were modified
  - $WATCHEXEC_META_CHANGED_PATH is set when files/folders' metadata were modified - $WATCHEXEC_OTHERWISE_CHANGED_PATH is set for every other kind of pathed event

  */
  'environment'(cb) {
    let obj = {}
    try {
      let maxPath = ``
      obj = Object.entries(process.env).reduce((acc, [key, val]) => {
        if (val && key.startsWith(`WATCHEXEC_`)) {
          const keyKey = key.replace(/^WATCHEXEC_/, ``)
          acc[keyKey] = val
          if(keyKey.startsWith(`CREATED_`)) {
            acc.type = `created`
          }
          if(keyKey.startsWith(`REMOVED_`)) {
            acc.type = `removed`
          }
          if(keyKey.startsWith(`RENAMED_`)) {
            acc.type = `renamed`
          }
          if(keyKey.startsWith(`WRITTEN_`)) {
            acc.type = `written`
          }
          if(keyKey.startsWith(`META_CHANGED_`)) {
            acc.type = `meta_changed`
          }
          if(keyKey.startsWith(`OTHERWISE_CHANGED_`)) {
            acc.type = `otherwise_changed`
          }
          if(keyKey !== `COMMON_PATH` && keyKey.endsWith(`_PATH`) && (val.length > maxPath.length)) {
           maxPath = val
          }
        }
        return acc
      }, {})

      /**
       * 谁的路径多就取谁, 因为 env 中会存在多个 val 都有 path 的情况, 例如:
       *  {
       *    "COMMON_PATH": "/mnt/d/git2/watchexec-bin",
       *    "RENAMED_PATH": "3:3 (2):4:4 (2)",
       *    "type": "meta_changed",
       *    "WRITTEN_PATH": ":4:4 (2)",
       *    "META_CHANGED_PATH": ":4:4 (2)"
       *  }
      */
      obj.pathList = (maxPath || ``).split(process.platform === `win32` ? `;` : `:`)
    } catch (error) {
      // ...
    }
    if(Object.keys(obj).length) {
      cb(obj)
    }
  },
}

function handleJsonStr(str) {
  let list = []
  try {
    const json = JSON.parse(`[${str.split(`\n`).join(`,`)}]`)
    const map = {}
    json.forEach(({tags = []}) => {
      const { simple, full } = tags.find(tag => tag.kind === `fs`) || {}
      const pathList = tags.filter(tag => tag.kind === `path`).map(({ absolute, filetype }) => ({ absolute, filetype }))
      const data = {
        full,
        simple,
        pathList,
      }
      const key = JSON.stringify(data)
      if(map[key] !== true && pathList.length) {
        list.push(data)
      }
      map[key] = true
    })
  } catch (error) {
    // ...
  }
  if(list.length) {
    return list
  }
}

map[process.argv[2]]((info) => {
  process.stdout.write(JSON.stringify(info, null, 2))
})

// {
//   COMMON_PATH: 'D:\\git2\\watchexec-bin',
//   pathList: [ 'util.js' ],
//   OTHERWISE_CHANGED_PATH: 'util.js',
//   type: 'otherwise_changed'
// }