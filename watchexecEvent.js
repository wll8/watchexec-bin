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
  'json-stdin'(cb) {
    process.stdin.on(`data`, data => {
      let list = []
      try {
        const str = String(data).trim()
        const json = JSON.parse(`[${str.split(`\n`).join(`,`)}]`)
        const map = {}
        json.forEach(({tags = []}) => {
          const [, {simple, full} = {}, {absolute, filetype} = {}] = tags
          const data = {
            full,
            simple,
            absolute,
            filetype,
          }
          const key = JSON.stringify(data)
          if(map[key] !== true && absolute) {
            list.push(data)
          }
          map[key] = true
        })
      } catch (error) {
        // ...
      }
      if(list.length) {
        cb(list)
      }
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
          acc.pathList = (val || ``).split(process.platform === `win32` ? `;` : `:`)
        }
        return acc
      }, {})
    } catch (error) {
      // ...
    }
    if(Object.keys(obj).length) {
      cb(obj)
    }
  },
}

map[process.argv[2]]((info) => {
  process.stdout.write(JSON.stringify(info, null, 2))
})
