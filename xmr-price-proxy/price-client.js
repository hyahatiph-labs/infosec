const axios = require('axios')
// something.b32.i2p
const HOST = process.env.I2P_HOST || ""
const HASH = process.env.TX_ID || ""
const SIGNATURE = process.env.SIGNATURE || ""
if (HOST === undefined || HOST === "" || HOST === null) {
  console.error('no host provided')
  process.exit(2);
}
const URL = `http://${HOST}/price/xmr`
// defaults to 4444
const PORT = process.env.I2P_HTTP_PROXY_PORT || 4444
console.log(`Fetching price over proxy port ${PORT}`)
// optional transaction authentication proxy token
const tpat = `TPAT hash="${HASH}", signature="${SIGNATURE}"`
axios.defaults.headers.get['www-authenticate'] = tpat;
const fetchPrice = () => axios.get(URL, {
  proxy: {
    host: 'localhost',
    port: PORT
  }
})
  .then(res => res.data)
  .catch(e => console.error(e))

module.exports = fetchPrice