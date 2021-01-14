const db = require('./utils/db')

const respJSON = require('./utils/respJSON')
const getJsonBody = require('./utils/getJsonBody')

const buildHandler = require('./utils/buildHandler')
const define = require('./utils/define')
const buildHandlerMeta = require('./utils/buildHandlerMata')

const postMethod = require('./utils/postMethod')
const genSID = require('./utils/genSID')

const getOssClient = require('./utils/getOssClient')

module.exports = { 
  db,
  respJSON,
  getJsonBody, 
  buildHandler, define, buildHandlerMeta,
  postMethod, 
  genSID,
  getOssClient
}