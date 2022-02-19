# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

## Development

* create a wallet name and password `himitsu` and mine / faucet some piconeros
* export environment variable `export REACT_APP_HIMITSU_DEV=DEV`
* if working on wallet init component, seed confirmation modal etc. don't export `REACT_APP_HIMITSU_DEV`
* start `monero-wallet-rpc` with: `./path/to/monero-wallet-rpc --stagenet --wallet-dir /full/path/to/wallets/dev/ --rpc-bind-port 38083 --rpc-login himitsu:himitsu`
* initial setup
    * start himitsu-proxy
        * `git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/himitsu/proxy`
        * `npm i` to install modules 
        * build with `npm run clean && npm run dev`
        * start proxy `node dist/src/proxy.js -p 5000 --rpc-login himitsu:himitsu --rpc-host localhost:38083 -w relative/path/to/wallets/from/home/directory`
    * `cd ../client` && `npm i`
* start the client with `npm start`
* UI is located at localhost:3000 in your favorite browser

## Building

* build browser extension with `npm run build`
* open Firefox (other browsers pending)
* type `about:debugging` into the url input
* click "This Firefox" on the left hand side
* Install temporary add-on from `$HOME/infosec/himitsu/build/index.html`
