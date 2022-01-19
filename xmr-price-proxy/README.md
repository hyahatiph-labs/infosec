Sample use of axios to pull price data for Monero ticker: XMR
over i2p from a proxy server.

## Setup

* `npm i`
* export environment variables:
    * `XMR_ADDRESS` - address for payments of server, required
    * `XMR_PRICE_PROXY_API_KEY` - api key (cryptocompare.com), required
    * `SERVER_PORT` - price-proxy server port, defaults to 7777
    * `XMR_RPC_PORT` - wallet-rpc port, defaults 18081
    * `XMR_RPC_HOST` - wallet-rpc host, defaults to 127.0.0.1
    * `PAY_PROTECT_MODE` - protect server with TPAT (transaction proof authentication token), 
        defaults to true
    * `XMR_PRICE_PROXY_CACHE_INTERVAL` - milliseconds for refreshing price, defaults to 600000
    * `XMR_PRICE_PROXY_TTL` - confirmations for minimum payment, defaults to 30 or ~ 1 hour
    * `XMR_PRICE_PROXY_MIN_AMOUNT` - minimum payment for TTL. (i.e. - min_amt - 0.01XMR and TTL of 
        30 confirmation would give TTL of 2 hours with 0.02XMR payment), default is 1000000 PICONERO
    * client:
        * `I2P_HOST` (something.b32.i2p), required
        * `I2P_HTTP_PROXY_PORT` - i2p port, defaults to 4444
        * `TX_ID` - hash for TPAT header
        * `SIGNATURE` - tx proof signature for TPAT header
* `node price-server.js`
* `node example.js`

## TPAT (transaction proof authentication token)

* allows monetization via tx proof
* scaling
    * payment available as soon as it leaves the tx pool
    * re-use / sharing of TPAT (like a ticket)
    * create caching payment strategies and tier-based payment for API's
* security - no access without valid proof

Example:

```bash
curl -ivk http://localhost:7777/price/xmr -H 'www-authenticate: TPAT hash="17c2d5252...", signature="OutProofV2..."'
```

invalid response: response is HTTP Status 402 with www-authenticate header set with payment address

```bash
< HTTP/1.1 402 Payment Required
HTTP/1.1 402 Payment Required
< Content-Security-Policy: default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Content-Security-Policy: default-src 'self';base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
< Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Embedder-Policy: require-corp
< Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Opener-Policy: same-origin
< Cross-Origin-Resource-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
< X-DNS-Prefetch-Control: off
X-DNS-Prefetch-Control: off
< Expect-CT: max-age=0
Expect-CT: max-age=0
< X-Frame-Options: DENY
X-Frame-Options: DENY
< Strict-Transport-Security: max-age=15552000; includeSubDomains
Strict-Transport-Security: max-age=15552000; includeSubDomains
< X-Download-Options: noopen
X-Download-Options: noopen
< X-Content-Type-Options: nosniff
X-Content-Type-Options: nosniff
< Origin-Agent-Cluster: ?1
Origin-Agent-Cluster: ?1
< X-Permitted-Cross-Domain-Policies: none
X-Permitted-Cross-Domain-Policies: none
< Referrer-Policy: no-referrer
Referrer-Policy: no-referrer
< X-XSS-Protection: 0
X-XSS-Protection: 0
< www-authenticate: TPAT address="54gqcJZAtgzBFnQWEQHec3RoWfmoHqL4H8sASqdQMGshfqdpG1fzT5ddCpz9y4C2MwQkB5GE2o6vUVCGKbokJJa6S6NSatn", min_amt="1000000", ttl="30", hash="", signature=""
www-authenticate: TPAT address="54gqcJZAtgzBFnQWEQHec3RoWfmoHqL4H8sASqdQMGshfqdpG1fzT5ddCpz9y4C2MwQkB5GE2o6vUVCGKbokJJa6S6NSatn", min_amt="1000000", ttl="30", hash="", signature=""
< Date: Wed, 19 Jan 2022 09:44:11 GMT
Date: Wed, 19 Jan 2022 09:44:11 GMT
< Connection: keep-alive
Connection: keep-alive
< Keep-Alive: timeout=5
Keep-Alive: timeout=5
< Content-Length: 0
Content-Length: 0
```
