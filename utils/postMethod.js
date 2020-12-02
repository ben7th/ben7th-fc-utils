const getJsonBody = require('./getJsonBody')
const db = require('./db')

const postMethod = (path, callback) => {
  let _f = async ({ req, resp, route }) => {
    let { body } = await getJsonBody({ req, resp })
    let res
    await db.connectDB(async () => {
      res = await callback(body)
    })
    return res
  } 
  return [path, _f]
}

module.exports = postMethod