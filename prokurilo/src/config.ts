import * as yargs from "yargs";
import os from "os";

// jailed token interface
export interface JailedToken {
    timestamp: number
    signature: string
}

// asset interface
export interface Asset {
    amt: number
    ttl: number
    uri: string
    static: boolean
    file: string | null
    subaddress: string
    override: boolean
}

// interface for the config file
export interface ConfigFile {
    port: number
    host: string
    assets: Asset[]
    bypass: string[]
}

/**
 * User input for the prokurilo
 */
 const ARGS = yargs
 .option("key-path", {
  string: true,
  alias: "kp",
  description: "Path to SSL private key",
  demand: false,
})
.option("cert-path", {
  string: true,
  alias: "cep",
  description: "Path to the server certification",
  demand: false,
})
 .option("asset-host", {
   string: true,
   alias: "a",
   description: "Host and port of assets, e.g. localhost:1234",
   demand: true,
 })
 .option("anti-spam-threshold", {
   number: true,
   default: 60,
   alias: "ast",
   description: "Number of minutes for anti-spam binning (default: 60 min.)",
   demand: false,
 })
 .option("jail-janitor-interval", {
  number: true,
  default: 10,
  alias: "j",
  description: "Interval for clearing jailed tokens (default: 10 min.)",
  demand: false,
  })
 .option("port", {
   number: true,
   alias: "p",
   description: "Port to run this server on",
   demand: true,
 })
 .option("rpc-host", {
   string: true,
   alias: "r",
   description: "Host and port of monero-wallet-rpc",
   demand: true,
 })
 .option("himitsu-rpc-restrict", {
  boolean: true,
  default: false,
  description: "Authenticates a single himitsu client only.",
  demand: true,
})
.option("disable-i2p-check", {
  boolean: true,
  default: false,
  description: "Stay online without i2p detected",
  demand: true,
})
 .option("log-level", {
   string: true,
   alias: "l",
   description: "comma separated list of log levels to maintain",
   demand: false,
 }).argv;

export enum Header {
    WWW_AUTHENTICATE = "www-authenticate",
    AUTHORIZATION = "authorization",
}

export enum RPC {
  ID = "0",
  VERSION = "2.0",
  CHECK_TX_PROOF = "check_tx_proof",
  CLOSE = "close_wallet",
  VERIFY = "verify",
  GET_VERSION = "get_version",
}

export const EXIT_ERROR = 1

export enum Http {
    OK = 200,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRED = 402,
    FORBIDDEN = 403,
    BAD_REQUEST = 404,
    SERVER_FAILURE = 503
}

export interface TPAT {
    hash: string
    min_amt: number
    signature: string
    subaddress: string
    ttl: number
}

// global log level
const LOG_LEVEL_ARG: string = ARGS["log-level"];
const IS_MULTI_LOG_LEVEL: boolean =
  LOG_LEVEL_ARG &&
  LOG_LEVEL_ARG.length > 0 &&
  LOG_LEVEL_ARG.indexOf(",") > 0;
const singleLogLevel: string[] = [];
if (!IS_MULTI_LOG_LEVEL && LOG_LEVEL_ARG) {
  singleLogLevel.push(LOG_LEVEL_ARG);
} else {
  // default log level
  singleLogLevel.push("INFO");
  singleLogLevel.push("ERROR");
}
export const LOG_FILTERS: string[] | null = IS_MULTI_LOG_LEVEL
  ? LOG_LEVEL_ARG.split(",")
  : !IS_MULTI_LOG_LEVEL
  ? singleLogLevel
  : null;

// some defaults for linux
export const CONFIG_PATH = `${os.homedir()}/.prokurilo/config.json`;
export const LOG_FILE = `${os.homedir}/.prokurilo/app.log`;
export const DEFAULT_CONFIG: ConfigFile = {
    port: 8989,
    host: "http://localhost",
    assets: [
      { 
        "amt": 2000000 ,
        "ttl": 60,
        "uri": "/test",
        "file": "protected.html",
        "static": true,
        "subaddress": "7BvXjs5AuYi5YXxe4HvHtjEqDndJKVLvXgUmfpVDX9kr7Y4oCnCrVPUNWyopi4YAsXgP6epapXuinWH94n89bLsmEcPxTNW",
        "override": false
      }
    ],
    bypass: ["/"]
  };
export const INDENT = 2;
export const LOCAL_HOSTS: string[] = ["::ffff:127.0.0.1", "127.0.0.1", "::1"];

export const I2P_CHECK_INTERVAL = 60000;
export const I2P_KILL_SWITCH_LIMIT = 21;
export const I2P_OFFLINE_ERROR = 2;

export const HIMITSU_TTL = 60000 * 20
// set cmd line args
export const PORT: number = ARGS["port"];
export const KEY_PATH: string = ARGS["key-path"];
export const CERT_PATH: string = ARGS["cert-path"];
export const ASSET_HOST: string = ARGS["asset-host"];
export const XMR_RPC_HOST: string = ARGS["rpc-host"];
export const I2P_CHECK_DISABLED: boolean = ARGS["disable-i2p-check"];
export const HIMITSU_RESTRICTED: boolean = ARGS["himitsu-rpc-restrict"];
export const ANTI_SPAM_THRESHOLD: number = ARGS["anti-spam-threshold"] * 60000;
export const JAIL_JANITOR_INTERVAL: number = ARGS["jail-janitor-interval"] * 60000;