# himitsu client

[ POC / WIP ]

Lightweight Monero wallet and browser extension for quick interface with
monero-wallet-rpc and webxmr. 
Test bed for bleeding edge features (consensus wallet, swaps, etc.)

![architecture](himitsu_arch.png)

### Firefox

* experimental version in [store](https://addons.mozilla.org/en-US/firefox/addon/himitsu/)
* still much work to do to get this to work out of the box and connect to public rpc over i2p
* development requires code from approved [pull request](https://github.com/monero-project/monero/pull/8187) which is not yet merged

<br />

![himitsu](himitsu.png)

## Development

* New to Monero? Start [here](https://getmonero.org).
* Install node.js via [nvm](https://github.com/nvm-sh/nvm) (`nvm install 16` and `nvm use 16`)
* create a wallet name and password `himitsu` and mine / faucet some piconeros
* export environment variable `export REACT_APP_HIMITSU_DEV=DEV`
* if working on wallet init component, seed confirmation modal etc. don't export `REACT_APP_HIMITSU_DEV`
* pull the code from this [pull request](https://github.com/monero-project/monero/pull/8187), and compile it
* start `monerod` with `--stagenet` flag
* start `monero-wallet-rpc` with: `./path/to/monero-wallet-rpc --stagenet --wallet-dir /full/path/to/Monero/wallets/dev/ --rpc-bind-port 38083 --rpc-access-control-origins http://localhost:3000 --disable-rpc-login`
* initial setup => `git clone https://github.com/hyahatiph-labs/infosec.git && cd infosec/himitsu && npm i`
* start the client with `npm start`
* UI is located at localhost:3000 in your favorite browser
* works best to view in responsive 500 * 600 (responsive design in progress)

### Android

* Like mobile apps?
* get started with the Android build by downloading [Android Studio](https://developer.android.com/studio/#downloads)
* Read up on [Capacitor](https://capacitorjs.com/docs) and [Capacitor Android](https://capacitorjs.com/docs/android)
* set the environment variable like `export CAPACITOR_ANDROID_STUDIO_PATH=$HOME/android-studio/bin/studio.sh` for 
  `npx cap open android` and `export ANDROID_HOME=$HOME/Android/Sdk` for `npx cap run android`
* create an emulator, build and hack away
* get device ip with a command like `ip a` (Linux)
* on load go in app settings and change host 'DEVICE_IP':'RPC_PORT'
* start `monero-wallet-rpc` on a local network dedicated for development `./build/Linux/_HEAD_detached_at_pr-review_no_rpc_aco_login_/release/bin/monero-wallet-rpc --stagenet --wallet-dir /path/to/Monero/wallets/dev --rpc-bind-port 38083 --rpc-access-control-origins "*" --disable-rpc-login --rpc-bind-ip <DEVICE_IP> --confirm-external-bind`
* dont' forget to run `npm run build` before running on the android emulator

### Prokurilo

* himitsu currently requires `--rpc-login-disabled` which prevents public rpc server usage
* [prokurilo](https://github.com/hyahatiph-labs/infosec/tree/main/prokurilo) is a reverse proxy authentication server that integrates with the wallet
* it basically performs a handshake when the wallet is created 
* random 32-byte challenge is combined with the signature and primary address of the newly created wallet
* this is used like a cookie until the expiration set by prokurilo is reached `<primary_address>:<signature>`
* this is experimental, unreleased software so it is not vetted for mainnet usage
* Major con of prokurilo is losing local host login. Mitigate by having rpc on a locked down pi or android device on an isolated network with hardened ACL of necessary connections (monerod, i2p port, etc.) 

## Building

* build browser extension with `npm run build`
* open Brave (other browsers pending)
* extensions => "Load Unpacked"
* open the `build` directory

## Releasing

* `cd build`
* `zip -r -FS himitsu-vx.x.x-experimental.zip * --exclude '*.git*'`

### Additional Notes

* there is a `Dockerfile` that can run with `docker build -t himitsu:v.0.1.0 .` from the infosec/himitsu directory
* if using the optimized build run `monero-wallet-rpc` with `./path/to/monero-wallet-rpc --stagenet --wallet-dir /full/path/to/Monero/wallets/dev/ --rpc-bind-port 38083 --rpc-access-control-origins "*" --disable-rpc-login`

## Testing

In progress

## TODOs

see [milestones](https://github.com/hyahatiph-labs/infosec/milestones)
