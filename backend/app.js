const fs = require('fs')
const path = require('path')
const os = require('os')

async function start() {
  const tmpPath = os.tmpdir()
  if (!fs.existsSync(path.resolve(tmpPath, 'anonymous_token'))) {
    fs.writeFileSync(path.resolve(tmpPath, 'anonymous_token'), '', 'utf-8')
  }

  const { server } = require('NeteaseCloudMusicApi')
  const { serveNcmApi } = server
  await serveNcmApi({ port: 3000, checkVersion: false })
  console.log('网易云 API 服务已启动: http://localhost:3000')
}

start().catch(console.error)
