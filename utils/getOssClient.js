const OSS = require('ali-oss')

const getOssClient = ({ region, bucket }) => {
  const client = new OSS({
    region,
    bucket,
    "accessKeyId": process.env.ACCESS_KEY_ID,
    "accessKeySecret": process.env.ACCESS_KEY_SECRET
  })

  return client
}

module.exports = getOssClient