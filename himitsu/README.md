# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

![himitsu](https://user-images.githubusercontent.com/13033037/154781827-1f57b602-f18b-4173-ab94-fd62b92cbfe0.png)

## Development

* create a wallet name and password `himitsu` and mine / faucet some piconeros
* export environment variable `export REACT_APP_HIMITSU_DEV=DEV`
* if working on wallet init component, seed confirmation modal etc. don't export `REACT_APP_HIMITSU_DEV`
* pull the code from this [pull request](https://github.com/monero-project/monero/pull/8187), and compile it
* start `monero-wallet-rpc` with: `./path/to/monero-wallet-rpc --stagenet --wallet-dir /full/path/to/Monero/wallets/dev/ --rpc-bind-port 38083 --rpc-access-control-origins http://localhost:3000 --disable-rpc-login`
* initial setup `cd ../client` && `npm i`
* start the client with `npm start`
* UI is located at localhost:3000 in your favorite browser

## Building

* build browser extension with `npm run build`
* open Firefox (other browsers pending)
* type `about:debugging` into the url input
* click "This Firefox" on the left hand side
* Install temporary add-on from `$HOME/infosec/himitsu/build/index.html`
