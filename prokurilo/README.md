# prokurilo

A reverse proxy authentication server that utilizes TPATs
   
## Project Layout

```bash
prokurilo/
├── src                # Directory of source code
   ├── test              # Test files
   ├── config.ts         # Configuration properties
   ├── prokurilo.ts        # Entry point for the app
   ├── setup.ts          # Creates configuration test RPC connections.
   ├── logging.ts        # In house logger, since TS hates console.log()
   ├── util.ts           # General purpose functions
```

## Building

1. `cd prokurilo/` and run `npm i` to install modules
2. Run `npm run clean && npm run build`
3. Output is in `/dist`

## Development

1. Run `node dist/prokurilo.js` to run server *--help for help
2. Set environment variable `NODE_ENV=test` to use example static content 
3. Verify configuration files at `~/.prokurilo/config.json`

<br/>

```bash
Options:
      --help                Show help                                  [boolean]
      --version             Show version number                        [boolean]
  -a, --asset-host          Host and port of asset, e.g. localhost:1234
                                                             [string] [required]
      --allowed-uris, --au  Comma separated list of URIs     [string] [required]
  -p, --port                Port to run this server on       [number] [required]
  -r, --rpc-host            Host and port of monero-wallet-rpc
                                                             [string] [required]
      --log-level, --ll     comma separated list of log levels to maintain
                                                                        [string]

Missing required arguments: asset-host, allowed-uris, port, rpc-host
```

## Notes
1. This application runs on the latest Node 16.x+
2. Currently, only battle tested on Fedora 35 stable

<b>Sample ~/.prokurilo/config.json</b>

```json 
{
  "port": 8081,
  "host": "http://localhost",
  "assets": [
    { "amt": 2000000 ,
      "ttl": 60,
      "uri": "/test",
      "file": "protected.html",
      "static": true,
      "subaddress": "7BvXjs5AuYi5YXxe4HvHtjEqDndJKVLvXgUmfpVDX9kr7Y4oCnCrVPUNWyopi4YAsXgP6epapXuinWH94n89bLsmEcPxTNW",
      "override": false
    }
  ],
  "bypass": ["/"]
}
```
