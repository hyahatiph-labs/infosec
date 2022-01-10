const express = require('express')
const helmet  = require('helmet')
const axios   = require('axios')
const runner  = require('./test-runner');
const APP     = express()
// set API_KEY env variable first
const API_KEY = process.env.PRICE_PROXY_API_KEY
const URL = `https://min-api.cryptocompare.com/data/price?fsym=XMR&tsyms=BTC&api_key=${API_KEY}`
const PORT = process.env.XMR_PRICE_PROXY_PORT || 7777

APP.disable('x-powered-by');
// add helmet for hardening
APP.use(helmet({
  frameguard: {
    action: 'deny'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    }
  },
  dnsPrefetchControl: false
}));

APP.get('/price/xmr', (req, res) => {
    axios.get(URL)
      .then(r => res.json(r.data))
      .catch(e => console.log(e))
})

const listener = APP.listen(PORT,  () => {
  console.log(`XMR price-proxy running on port ${listener.address().port}`);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch(e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 3500);
  }
})

module.exports = { PORT } // for testing
