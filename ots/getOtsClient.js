const TableStore = require('tablestore')

module.exports = ({ endpoint, instancename }) => {
  const { ACCESS_KEY_ID, ACCESS_KEY_SECRET } = process.env
  if (!(ACCESS_KEY_ID && ACCESS_KEY_SECRET)) {
    throw new Error('没有环境变量 ACCESS_KEY_ID, ACCESS_KEY_SECRET')
  }

  return new TableStore.Client({
    accessKeyId: process.env.ACCESS_KEY_ID,
    accessKeySecret: process.env.ACCESS_KEY_SECRET,
    endpoint,
    instancename,
  })
}