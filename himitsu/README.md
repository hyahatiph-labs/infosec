# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

![himitsu](https://user-images.githubusercontent.com/13033037/155557047-d08ebb9b-7f65-4b0d-aec7-03a0f15cce06.png)

## Development

* create a wallet name and password `himitsu` and mine / faucet some piconeros
* export environment variable `export REACT_APP_HIMITSU_DEV=DEV`
* if working on wallet init component, seed confirmation modal etc. don't export `REACT_APP_HIMITSU_DEV`
* pull the code from this [pull request](https://github.com/monero-project/monero/pull/8187), and compile it
* start `monero-wallet-rpc` with: `./path/to/monero-wallet-rpc --stagenet --wallet-dir /full/path/to/Monero/wallets/dev/ --rpc-bind-port 38083 --rpc-access-control-origins http://localhost:3000 --disable-rpc-login`
* initial setup => `git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/himitsu && npm i`
* start the client with `npm start`
* UI is located at localhost:3000 in your favorite browser

## Building

* build browser extension with `npm run build`
* open Brave (other browsers pending)
* extensions => "Load Unpacked"
* open the `build` directory
