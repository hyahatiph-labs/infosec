const fetchPrice = require('./price-client')

fetchPrice().then(v => console.log(`1 XMR = ${v.BTC} BTC`))