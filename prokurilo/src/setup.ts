import ConfigFile, { Config, CONFIG_PATH, DEFAULT_CONFIG, INDENT } from "./config";
import log, { LogLevel } from "./logging";
import { promises as fsp } from "fs";
import os from "os";

/**
 * Check for a config file. If no config file
 * exists create some default values
 */
 export default async function setup(): Promise<void> {
    let config: ConfigFile | Buffer;
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
  }
