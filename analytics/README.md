# analytics

Monero blockchain analytics and exploratory data analysis tools.

## About

* This node.js (typescript) middleware synchronizes a Postgresql database for analytics
* Blocks are extracted from the Monero LMDB (lightning mapped database)
* The Postgresql is imported into an RStudio project where analysis and models can be prepared
* [ WIP ] living, breathing models constantly updating based on new blocks

## Project Layout

```bash
analytics/
├── src                # Directory of source code
   ├── test              # Test files
   ├── config.ts         # Configuration properties
   ├── analytics.ts      # Entry point for the app
   ├── models.ts         # Models for the databases
   ├── logging.ts        # In house logger, since TS hates console.log()
   ├── util.ts           # General purpose functions
```

## Building

1. `cd analytics/` and run `npm i` to install modules
2. Run `npm run clean && npm run build`
3. Output is in `/dist`

## Development

Install [Postgresql](https://www.postgresql.org/) for your machine
Run `node dist/analytics.js` to run server *--help for help

<br/>

```bash
Options:
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
  -u, --pg-user     Postgresql username                      [string] [required]
  -c, --pg-cred     Postgresql password                      [string] [required]
  -n, --pg-db-name  Postgresql database name                 [string] [required]
  -h, --pg-host     Postgresql host                          [string] [required]
  -p, --pg-port     Postgresql port                                     [string]
  -l, --log-level   comma separated list of log levels to maintain      [string]

Missing required arguments: pg-user, pg-cred, pg-db-name, pg-host
```
