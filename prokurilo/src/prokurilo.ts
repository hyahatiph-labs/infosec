/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import helmet from "helmet";
import * as Config from "./config";
import * as Util from "./util";
import os from "os";
import setup from "./setup";
import log, { LogLevel } from "./logging";
import https from 'https';
import fs from 'fs';
import cors from 'cors';


const NODE_ENV = process.env.NODE_ENV || "";

const APP = express();

const corsOptions = {
    origin: "*",
    method: ["OPTIONS","POST"],
    optionsSuccessStatus: 200
  };
APP.use(cors(corsOptions));

APP.use(express.json());
APP.use(express.urlencoded({ extended: true }));
// disable x-powered-by headers
APP.disable('x-powered-by');
// add helmet for hardening
APP.use(helmet({
  frameguard: {
    action: 'deny'
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
    }
  },
  dnsPrefetchControl: {
    allow: false
  }
}));

// entry
APP.get('/*', (req: any, res: any) => {
  Util.isValidProof(req, res);
})

APP.post('/*', (req: any, res: any) => {
  Util.isValidProof(req, res);
})

APP.delete('/*', (req: any, res: any) => {
  Util.isValidProof(req, res);
})

APP.patch('/*', (req: any, res: any) => {
  Util.isValidProof(req, res);
})

// initialize the config
setup();

// only stay online if i2p is online as well
Util.i2pCheck();
setInterval(() => { 
  Util.i2pCheck();
}, Config.I2P_CHECK_INTERVAL);

if (Config.HIMITSU_RESTRICTED) {
  log(`/sign API is open until himitsu configures`, LogLevel.WARN, true);
}

/* Anti-Spam Algorithm
 * Bin payments into default one-hour windows
 * keep short-term cache of proofs
 * array of {timestamp, proof} is fine
 * reject requests from jailed proofs
 * create janitor interval to sweep cache and reset tokens
 */
setInterval(() => {
  log('checking jail to free tokens...', LogLevel.INFO, false);
  Util.jail.forEach((j,i) => {
    if ((Date.now() - j.timestamp) > Config.ANTI_SPAM_THRESHOLD) {
      log(`free token at index: ${i}`, LogLevel.DEBUG, false);
      delete Util.jail[i]
    }
  })
}, Config.JAIL_JANITOR_INTERVAL)

// start the server
if (NODE_ENV === 'test' || Config.HIMITSU_RESTRICTED) {
  APP.listen(Config.PORT,  () => {
    log(`Prokurilo DEV running on ${os.hostname()}`, LogLevel.INFO, false);
  })
} else {
  try {
    log(`Prokurilo PROD running on ${os.hostname()}`, LogLevel.INFO, false);
    const HTTPS_SERVER = https.createServer({
      key: fs.readFileSync(Config.KEY_PATH),
      cert: fs.readFileSync(Config.CERT_PATH)
    }, APP);
    HTTPS_SERVER.listen(Config.PORT, 'localhost'); 
  } catch {
    throw new Error('failed to set https');
  }
}
