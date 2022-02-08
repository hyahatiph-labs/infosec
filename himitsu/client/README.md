# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

## himitsu proxy

A Node.js typescript server that facilitates React <-> Monero RPC

* proxy must run before the UI
* `cd proxy && npm run clean && npm run build && node dist/proxy.js`

## Development

* start the client with `cd ../client && npm start`
* should open react on localhost:3000

## Building

* build browser extension with `npm run build`
* open Firefox (other browsers pending)
* type `about:debugging` into the url input
* click "This Firefox" on the left hand side
* Install temporary add-on from `$HOME/infosec/himitsu/client/build/index.html`
