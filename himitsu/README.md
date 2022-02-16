# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

## Development

* `git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/himitsu`
* create a wallet name and password `himitsu` and mine / faucet some piconeros
* export environment variable `export REACT_APP_HIMITSU_DEV=DEV`
* if working on wallet init component, seed confirmation modal etc. don't export `REACT_APP_HIMITSU_DEV`
* start `monero-wallet-rpc` with: `./monero-gui-v0.17.3.0/extras/monero-wallet-rpc --stagenet --wallet-dir /path/to/Monero/wallets/ --rpc-bind-port 38083 --rpc-access-control-origins http://localhost:3000 --rpc-login himitsu:himitsu`
* start the client with `npm start` (`npm i` to install modules before first run)
* UI is located at localhost:3000 in your favorite browser

## Building

* build browser extension with `npm run build`
* open Firefox (other browsers pending)
* type `about:debugging` into the url input
* click "This Firefox" on the left hand side
* Install temporary add-on from `$HOME/infosec/himitsu/build/index.html`
