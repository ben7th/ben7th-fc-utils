const getOtsClient = require('./getOtsClient')
const packAsyncOtsClient = require('./packAsyncOtsClient')

const getAsyncOtsClient = ({ endpoint, instancename }) => {
  const otsClient = getOtsClient({ endpoint, instancename })
  const asyncOtsClient = packAsyncOtsClient(otsClient)
  return asyncOtsClient
}

module.exports = getAsyncOtsClient