const express = require('express')
const helmet  = require('helmet')
const axios   = require('axios')
const runner  = require('./test-runner');
const APP     = express()
// TODO: environment variables - move to config file
// TODO: create command line args
// TODO: fetch price from atomic swap sellers
// TODO: refactor to typescript
// TODO: github workflow with secrets
// TODO: add support for consolidating price data from atomic swap sellers
const API_KEY = process.env.XMR_PRICE_PROXY_API_KEY || ""
const URL = `https://min-api.cryptocompare.com/data/price?fsym=XMR&tsyms=BTC&api_key=${API_KEY}`
const PORT = process.env.XMR_PRICE_PROXY_PORT || 7777
const ADDRESS = process.env.XMR_ADDRESS || ""
const PAY_PROTECT_MODE = process.env.PAY_PROTECT_MODE || true
const XMR_RPC_PORT = process.env.XMR_RPC_PORT || 18083
const XMR_RPC_HOST = process.env.XMR_RPC_HOST || '127.0.0.1'
const DEBUG = process.env.XMR_PRICE_PROXY_DEBUG || false
const CACHE_INTERVAL = process.env.XMR_PRICE_PROXY_CACHE_INTERVAL || 600000
const CONFIRMATION_THRESHOLD = process.env.XMR_PRICE_PROXY_TTL || 30
const NODE_ENV = process.env.NODE_ENV || ""
const MIN_AMOUNT = process.env.XMR_PRICE_PROXY_MIN_AMOUNT || 1000000
// TODO: minimum viable payment mode: get estimated fee from daemon + 1 piconero
// const MIN_VIABLE_PAYMENT_MODE = process.env.MIN_VIABLE_PAYMENT_MODE || false
const HTTP = {
  OK: 200,
  PAYMENT_REQUIRED: 402,
  BAD_REQUEST: 404,
  SERVER_FAILURE: 503
}
const MILLISECONDS = 1000
const TEST_DELAY = 3000
const EXIT_ERROR = 1

let cachedPrice;

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
  dnsPrefetchControl: {
    allow: false
  }
}));

/**
 * Helper function for parsing the hash, signature etc. from header
 * @param {String} tpat - transaction proof authentication token 
 * @returns 
 */
const parseHeader = (tpat) => {
  const hash = tpat ? tpat.split(/hash="(.*)"/g)[1].split('"')[0] : ""
  const signature = tpat ? tpat.split(/signature="(.*)"/g)[1].split('"')[0] : ""
  const isValid = tpat !== undefined && tpat !== null 
    && hash !== undefined && hash !== null && hash !== ""
    && signature !== undefined && signature !== null && signature !== ""
    && tpat.indexOf("TPAT") > -1
  if (isValid) {
    return { hash, signature }
  }
  return null
}

/**
 * Helper function for return header in the response 
 */
const returnHeader = (parsedHeader, res) => {
  if (parsedHeader === null) {
    res.status(HTTP.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${ADDRESS}", ` +
      `min_amt="${MIN_AMOUNT}", ttl="${CONFIRMATION_THRESHOLD}", hash="", signature=""`).send()
  } else {
    res.status(HTTP.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${ADDRESS}", ` + 
      `min_amt="${MIN_AMOUNT}", ttl="${CONFIRMATION_THRESHOLD}", ` + 
      `hash="${parsedHeader.hash}", signature="${parsedHeader.signature}"`).send()
  }
}

// TODO: implement custom messages update js doc

/**
 * @param {Object} tpat - transaction proof authentication token
 * Object parsed from the www-authenticate header.
 * Format is 'www-authenticate: TPAT address="<recipient_address>"", 
 *  min_amount="<minimum_amount_piconero>", ttl="<confirmations>",
 *  hash="<transaction_hash>", signature="<transaction_proof>"'
 * @returns 
 */
const isValidProof = (tpat, res) => {
  // check the proof
  const values = parseHeader(tpat)
  if (values === null) {
    returnHeader(values, res)
  } else {
    let body = {
      "jsonrpc": "2.0",
      "id": "0",
      "method": "check_tx_proof",
      "params": {
        "address": ADDRESS, "txid": values.hash, "signature": values.signature
      }
    }
    axios
      .post(`http://${XMR_RPC_HOST}:${XMR_RPC_PORT}/json_rpc`, body)
      .then((rp) => {
        const p = rp.data.result
        if (DEBUG === 'true')
          console.debug(`DEBUG => rpc response: ${JSON.stringify(p)}`)
          /* 
            Validations:
              1. signature is valid or "good"
              2. the transaction is broadcasted - not in pool
              3. confirmations are not past the threshold the default is 30 blocks or about an hour
                 the transaction proof can be used like a ticket until that threshold. The MIN_AMOUNT
                 get one hour, doubling get two hours time-to-live etc.
          */
        const isValidTTL = Math.floor(p.received / MIN_AMOUNT) * CONFIRMATION_THRESHOLD > p.confirmations
        if (p.good === false || p.in_pool === true || !isValidTTL) {
          returnHeader(values, res)
        } else {
          res.status(HTTP.OK).json(cachedPrice)
        }
      }).catch(() => res.status(HTTP.SERVER_FAILURE).json({ message: "Proof generation failure" }))
    }
}

/**
 * Entry point
 * METHOD: GET
 * ACCESS: PUBLIC with TPAT
 */
APP.get('/price/xmr', (req, res) => {
  if (PAY_PROTECT_MODE === 'true' || NODE_ENV !== 'test') {
    isValidProof(req.headers['www-authenticate'], res)
  } else {
    res.status(HTTP.OK).json(cachedPrice)
  }
})

// cache price to save API usage and reduce time correlation
setInterval(() => {
  console.info(`Fetching price data every ${CACHE_INTERVAL / MILLISECONDS} seconds`)
  axios.get(URL)
    .then(r => cachedPrice = r.data)
    .catch(e => console.error("ERROR => Failed to cache price data"))
}, CACHE_INTERVAL)

// fetch price on startup
axios.get(URL).then(async r => { 
  cachedPrice = await r.data
  console.info(`INFO => Initial price cache is ${cachedPrice.BTC}`)
})
.catch(e => {
  console.error("ERROR => Unable to cache price data")
  process.exit(EXIT_ERROR)
})

// check for blank API_KEY
if (API_KEY === undefined || API_KEY === null || API_KEY === "") {
  console.error("ERROR => API_KEY is not set.")
  process.exit(EXIT_ERROR)
}

// check for blank ADDRESS
if (ADDRESS === undefined || ADDRESS === null || ADDRESS === "") {
  console.error("ERROR => ADDRESS is not set.")
  process.exit(EXIT_ERROR)
}

const listener = APP.listen(PORT,  () => {
  console.log(`XMR price-proxy running on port ${listener.address().port}`);
  if(NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch(e) {
        console.error('Tests are not valid:');
      }
    }, TEST_DELAY);
  }
})

module.exports = { PORT } // for testing
