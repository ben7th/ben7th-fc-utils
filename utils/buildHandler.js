const util = require('util')
const Router = require('url-router')
const respJSON = require('./respJSON')

const buildHandler = ({ apis }) => {
  const router = new Router(apis)

  return (req, resp, context) => {
    let route = router.find(req.path)
  
    if (route) {
      route.handler({ req, resp, route })
        .then(data => respJSON(resp, { data }))
        .catch(e => {
           resp.setStatusCode(500)
           respJSON(resp, { error: util.inspect(e).split(`\n`) })
         })
      return
    }
  
    resp.setStatusCode(404)
    respJSON(resp, { error: 'no such API PATH', path: req.path })
  }
}

module.exports = buildHandler