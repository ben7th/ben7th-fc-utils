const respJSON = (resp, data) => {
  resp.setHeader('content-type', 'application/json')
  resp.send(JSON.stringify(data))
}

module.exports = respJSON