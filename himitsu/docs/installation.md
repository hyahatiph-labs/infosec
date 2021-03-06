# Installation

This is a work in progress. Hope to make the installation process
more streamlined in the near future.

## App

* Experimental version in [Firefox App Store](https://addons.mozilla.org/en-US/firefox/addon/himitsu/)
* or build from source as shown in the readme

## I2P

* install from [i2p.net](https://geti2p.net/en/download)
* start i2prouter, e.g. `./i2p/i2prouter start`
* set browser proxy to `localhost:4444`

Example i2p proxy in Firefox (Settings => Network Settings)

![proxy](proxy.png)

## Prokurilo
 * in i2p create a hidden service for prokurilo
    * http://127.0.0.1:7657/i2ptunnelmgr
    * I2P Hidden Services => New Hidden Service "HTTP" => Create
 * after adding info with port, start the hidden service
 
 ![hidden](i2p_hidden_service_mgr.png)

 * update tunnel performance

 ![performance](tunnel_performance.png)

* start monero-wallet-rpc `./path/to/monero-wallet-rpc --stagenet --wallet-dir /path/to/Monero/wallets/dev --rpc-bind-port 38083 --disable-rpc-login`
* connect prokurilo to the local rpc instance
    * `git clone http://github./com/hyahatiph-labs/infosec.git && cd infosec/prokurilo`
    * `npm run clean && npm run build`
    * `node dist/prokurilo.js -a localhost:38083 -p 7777 -r 127.0.0.1:38083 -l INFO,WARN,ERROR --himitsu-rpc-restrict`
* enter the hidden service `.b32.i2p` address when starting the app (it can be found on the tunnel manager at http://127.0.0.1:7657/i2ptunnelmgr)
* wait for prokurilo to detect active i2p session

```bash
[INFO]  2022-03-11T03:11:39.573Z => Prokurilo DEV running on fedora
[WARN]  2022-03-11T03:11:39.600Z => /sign API is open until himitsu configures
[DEBUG] 2022-03-11T03:11:39.614Z => static demo content loaded: iluvxmrchan.gif,login.html,protected.html
[INFO]  2022-03-11T03:11:39.625Z => Connected to monero-wallet-rpc version: 65558
[INFO]  2022-03-11T03:11:39.647Z => i2p is starting up
[INFO]  2022-03-11T03:12:39.618Z => i2p is starting up
[INFO]  2022-03-11T03:13:39.609Z => i2p is starting up
[INFO]  2022-03-11T03:14:39.602Z => i2p is starting up
[INFO]  2022-03-11T03:15:39.596Z => i2p is starting up
[INFO]  2022-03-11T03:16:39.603Z => i2p is active
```