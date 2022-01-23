import * as yargs from "yargs";
import os from "os";

// asset interface
interface Asset {
    amt: number
    ttl: number
    uri: string
    subaddress: string
}

// interface for the config file
export default interface ConfigFile {
    port: number
    host: string
    assets: Asset[]
}

/**
 * User input for the prokurilo
 */
 const ARGS = yargs
 .option("asset", {
   string: true,
   alias: "a",
   description: "Host and port of asset, e.g. http://localhost:1234",
   demand: true,
 })
 .option("allowed-uris", {
   string: true,
   alias: "au",
   description: "Comma separated list of URIs",
   demand: true,
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
   demand: false,
 })
 .option("log-level", {
   string: true,
   alias: "ll",
   description: "comma separated list of log levels to maintain",
   demand: false,
 }).argv;

export enum Config {
    WWW_AUTHENTICATE = "www-authenticate",
    RPC_ID = "0",
    RPC_VERSION = "2.0",
    RPC_METHOD = "check_tx_proof",
    EXIT_ERROR = 1
}

export enum Http {
    HTTP_OK = 200,
    PAYMENT_REQUIRED = 402,
    BAD_REQUEST = 404,
    SERVER_FAILURE = 503
}

export interface Data {
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
export const DEFAULT_CONFIG: ConfigFile = {
    port: 8989,
    host: "http://localhost",
    assets: []
  };
export const INDENT = 2;

// set cmd line args
export const PORT: number = ARGS["port"];
export const ASSET: string = ARGS["asset"];
export const XMR_RPC_HOST: string = ARGS["rpc-host"];
export const ALLOWED_URIS: string[] = ARGS["allowed-uris"].split(",")