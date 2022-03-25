# Analytics

Monero blockchain analytics and exploratory data analysis tools.

## About

* This node.js (typescript) middleware synchronizes a Postgresql database for analytics
* Blocks are extracted from the Monero LMDB (lightning mapped database) via [monero-javascript](https://www.npmjs.com/package/monero-javascript)
* The Postgresql is imported into an RStudio project where analysis and models can be prepared
* [ WIP ] living, breathing models constantly updating based on new blocks
* NRPS stack
    - node.js middleware
    - r statistical programming
    - postgresql database
    - sequelize object relationship mapping (ORM)

## Project Layout

```bash
analytics/
├── src                # Directory of source code
   ├── test              # Test files
   ├── analytics.ts      # Entry point for the app
   ├── config.ts         # Configuration properties / interfaces
   ├── models.ts         # Models for the databases
   ├── logging.ts        # In house logger, since TS hates console.log()
   ├── util.ts           # General purpose functions
```

## Building

1. `cd analytics/` and run `npm i` to install modules
2. Run `npm run clean && npm run build`
3. Output is in `/dist`

## Development

* Install [Postgresql](https://www.postgresql.org/) for your machine
* Run `node dist/analytics.js` to run server *--help for help

<br/>

```bash
Options:
      --help               Show help                                   [boolean]
      --version            Show version number                         [boolean]
  -u, --pg-user            Postgresql username               [string] [required]
  -c, --pg-credential      Postgresql password               [string] [required]
  -n, --pg-db-name         Postgresql database name          [string] [required]
  -h, --pg-host            Postgresql host                   [string] [required]
  -p, --pg-port            Postgresql port                   [string] [required]
      --daemon-host        Host and port of Monero Daemon RPC.
                                   [boolean] [default: "http://localhost:38081"]
      --daemon-user        Username of Monero Daemon RPC. [string] [default: ""]
      --daemon-credential  Password of Monero Daemon RPC. [string] [default: ""]
      --num-blocks         Number of blocks from tip to extract
                                                           [number] [default: 0]
      --report             FUTURE USE. Generate new analytics report on new
                           height                                      [boolean]
      --wipe-db            DEV USE. Destructive action. Wipes the Analytics
                           database.                                   [boolean]
  -l, --log-level          comma separated list of log levels to maintain (e.g.
                           -l ERROR,INFO,DEBUG)                         [string]

Missing required arguments: pg-user, pg-credential, pg-db-name, pg-host, pg-port
```
