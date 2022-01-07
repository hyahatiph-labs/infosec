const express = require('express')
const axios = require('axios')
const APP = express()
const PORT = process.env.PORT || 7777
// set API_KEY env variable first
const API_KEY = process.env.PRICE_PROXY_API_KEY
const URL = `https://min-api.cryptocompare.com/data/price?fsym=XMR&tsyms=BTC&api_key=${API_KEY}`

APP.get('/price/xmr', (req, res) => {
    axios.get(URL)
      .then(r => res.json(r.data))
      .catch(e => console.log(e))
})
APP.listen(PORT, () => console.log(`XMR price-proxy running on port ${PORT}`))