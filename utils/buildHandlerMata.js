const buildHandler = require("./buildHandler")

module.exports = (modules) => {
  let defs = []
  for (m of modules) {
    defs = [].concat(defs).concat(m)
  }
  const apis = defs.map(x => x.api)
  const meta = defs.map(x => x.meta)
  
  const handler = buildHandler({ apis })

  return { handler, meta }
}