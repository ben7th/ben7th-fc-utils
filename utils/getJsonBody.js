const jsonBody = require('body/json')

const getJsonBody = async ({ req, resp }) => {
  return new Promise(resolve => {
    jsonBody(req, resp, (err, body) => {
      resolve({ err, body })
    })
  })
}

module.exports = getJsonBody