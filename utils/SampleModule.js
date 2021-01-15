const define = require('./define')

module.exports = [
  // 连通测试
  define ('SlimeTest', '/slime/test', async ({ foo, bar }) => {
    let sample = { slime: 'smile' }
    return { sample, foo, bar }
  })
]