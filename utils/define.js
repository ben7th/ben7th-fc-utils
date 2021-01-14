const getJsonBody = require("./getJsonBody")

class MethodPacker {
  constructor ({ config }) {
    let _config
    if (!config) {
      _config = { useDB: false, type: 'json' }
    }
    this.config = _config
  }

  async getBody ({ req, resp }) {
    if (this.config.type === 'json') {
      let { err, body } = await getJsonBody({ req, resp })
      return { err, body }
    }
  }

  async call ({ callback, body }) {
    if (this.config.useDB === true) {
      let res
      await db.connectDB(async () => {
        res = await callback(body)
      })
      return res
    }

    if (this.config.useDB === false) {
      return await callback(body)
    }
  }

  handle ({ callback }) {
    return async ({ req, resp }) => {
      let { body } = await this.getBody({ req, resp})
      return await this.call({ callback, body })
    }
  }
}

// 定义一个 API 函数
const define = (name, path, callback, config) => {
  let packer = new MethodPacker({ config })
  let api = [path, packer.handle({ callback })]
  let meta = { name, path }
  return { api, meta }
}

module.exports = define