Sample use of axios to pull price data for Monero ticker: XMR
over i2p from a proxy server.

* `npm i`
* export env variable for `I2P_HOST` and `I2P_HTTP_PROXY_PORT` (defaults to 4444)
* export env variable for `PRICE_PROXY_API_KEY` (cryptocompare.com)
* export env variable for server `SERVER_PORT` (defaults to 7777)
* `node price-server.js`
* `node example.js`
