// async 封装
const _AsyncOtsMethod = async (method, { otsClient, params }) => {
  return new Promise((resolve, reject) => {
    let _m = otsClient[method].bind(otsClient)
    _m(params, (err, data) => {
      err ? reject(err) : resolve(data)
    })
  })
}

// 包装原本的 OtsClient 使得可以以 await 的方式被调用
const packAsyncOtsClient = (otsClient) => {
  let methods = [
    'putRow', 'getRow', 'getRange',
    'batchWriteRow', // 2021.02.01
  ]

  let res = {}
  for (let method of methods) {
    res[method] = async (params) => {
      return await _AsyncOtsMethod(method, { otsClient, params })
    }
  }

  return res
}

module.exports = packAsyncOtsClient