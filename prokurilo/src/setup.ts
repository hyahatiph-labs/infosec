import ConfigFile, { Config, CONFIG_PATH, DEFAULT_CONFIG, INDENT, XMR_RPC_HOST } from "./config";
import log, { LogLevel } from "./logging";
import { promises as fsp } from "fs";
import axios from "axios";
import os from "os";

let config: ConfigFile | Buffer;

/**
 * Accessor for the configs
 */
export const getConfigs = (): ConfigFile | Buffer => {
  return config;
}

/**
 * Check for a config file. If no config file
 * exists create some default values
 */
 export default async function setup(): Promise<void> {
    try {
      config = await fsp.readFile(CONFIG_PATH);
    } catch {
      log("no config file found", LogLevel.ERROR, true);
      await fsp
        .mkdir(`${os.homedir()}/.prokurilo/`)
        .catch(() => log(`path for config already exists`, LogLevel.INFO, true));
      await fsp
        .writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, INDENT))
        .catch(() => log("failed to write config file", LogLevel.INFO, true));
      config = await fsp.readFile(CONFIG_PATH);
      if (!config) {
        log("failed to write config", LogLevel.ERROR, true);
        process.exit(Config.EXIT_ERROR);
      }
    }
    // verify RPC connection
    const body = {
      jsonrpc: Config.RPC_VERSION,
      id: Config.RPC_ID,
      method: Config.RPC_GET_VERSION,
    }
    axios.post(`http://${XMR_RPC_HOST}/json_rpc`, body)
      .then(v => {
        log(`Connected to monero-wallet-rpc version: ${v.data.result.version}`, LogLevel.INFO, true);
      })
      .catch(() => { throw new Error('failed to connect to monero-wallet-rpc') })
  }
