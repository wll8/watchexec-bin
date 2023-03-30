
/**
 * 处理含有空格的命令行路径参数
 * @param {*} path 
 * @returns 
 */
function handlePathSpaces(path) {
  const newStr = path.split(/[\\/]+/).map(name => {
    return name.includes(` `) ? `"${name}"` : name
  }).join(`/`)
  return newStr
}

/**
 * 发布订阅模式
 */
class PubSub {
  constructor() {
    this.events = {}
  }
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }
  emit(event, data) {
    if (!this.events[event]) {
      return
    }
    this.events[event].forEach(callback => {
      callback(data)
    })
  }
}

module.exports = {
  PubSub,
  handlePathSpaces,
}

