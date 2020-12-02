const STR = 
  "abcdefghijklmnopqrstuvwxyz" +
  // "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "0123456789"

const genSID = (len = 6) => {
  // let len = 6
  let res = ""

  let idx0 = Math.floor(Math.random() * (STR.length - 10))
  let c0 = STR[idx0]
  res = `${res}${c0}`

  for (let i = 0; i < len - 1; i ++) {
    let idx = Math.floor(Math.random() * STR.length)
    let c = STR[idx]
    res = `${res}${c}`
  }

  return res
}

module.exports = genSID