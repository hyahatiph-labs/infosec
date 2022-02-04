import * as CONFIG from "./config";
import log, { LogLevel } from "./logging";
import { promises as fsp } from "fs";
import axios from "axios";
import path from "path";
import os from "os";

let config: CONFIG.ConfigFile | Buffer;
let demoStaticFiles: string[];
/**
 * Accessor for the configs
 */
export const getConfigs = (): CONFIG.ConfigFile | Buffer => {
  return config;
}

/**
 * Accessor for the static content list
 * @returns string[] - list of static demo content
 */
export const getDemoStaticFiles = (): string[] => {
  return demoStaticFiles;
}

/**
 * Check for a config file. If no config file
 * exists create some default values
 */
 export default async function setup(): Promise<void> {
    try {
      config = await fsp.readFile(CONFIG.CONFIG_PATH);
    } catch {
      log("no config file found", LogLevel.ERROR, true);
      await fsp
        .mkdir(`${os.homedir()}/.prokurilo/`)
        .catch(() => log(`path for config already exists`, LogLevel.INFO, true));
      await fsp
        .writeFile(CONFIG.CONFIG_PATH, JSON.stringify(CONFIG.DEFAULT_CONFIG, null, CONFIG.INDENT))
        .catch(() => log("failed to write config file", LogLevel.INFO, true));
      config = await fsp.readFile(CONFIG.CONFIG_PATH);
      if (!config) {
        await log("failed to write config", LogLevel.ERROR, true);
      }
    }
    // verify RPC connection
    const body = {
      jsonrpc: CONFIG.RPC.VERSION,
      id: CONFIG.RPC.ID,
      method: CONFIG.RPC.GET_VERSION,
    }
    axios.post(`http://${CONFIG.XMR_RPC_HOST}/json_rpc`, body)
      .then(v => {
        log(`Connected to monero-wallet-rpc version: ${v.data.result.version}`, LogLevel.INFO, true);
      })
      .catch(() => { throw new Error('failed to connect to monero-wallet-rpc') })
    // get demo files
    await fsp.readdir(path.join(__dirname, "../examples/static"))
      .then(v => demoStaticFiles = v)
      .then(() => log(`static demo content loaded: ${demoStaticFiles}`, LogLevel.DEBUG, false))
      .catch(() => log(`failed to fetch demo files`, LogLevel.DEBUG, false))
  }
