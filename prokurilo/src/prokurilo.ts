import express from "express";
import helmet from "helmet";
import { ANTI_SPAM_THRESHOLD, CERT_PATH, JAIL_JANITOR_INTERVAL, KEY_PATH, PORT } from "./config";
import isValidProof, { jail } from "./util";
import os from "os";
import setup from "./setup";
import log, { LogLevel } from "./logging";
import https from 'https';
import fs from 'fs';

const NODE_ENV = process.env.NODE_ENV || "";

const APP = express();
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
  isValidProof(req, res);
})

APP.post('/*', (req: any, res: any) => {
  isValidProof(req, res);
})

APP.delete('/*', (req: any, res: any) => {
  isValidProof(req, res);
})

APP.patch('/*', (req: any, res: any) => {
  isValidProof(req, res);
})

// initialize the config
setup();

/* Anti-Spam Algorithm
 * Bin payments into default one-hour windows
 * keep short-term cache of proofs
 * array of {timestamp, proof} is fine
 * reject requests from jailed proofs
 * create janitor interval to sweep cache and reset tokens
 */
setInterval(() => {
  log('checking jail to free tokens...', LogLevel.INFO, true)
  jail.forEach((j,i) => {
    if ((j.timestamp - Date.now()) > ANTI_SPAM_THRESHOLD) {
      delete jail[i]
    }
  })
}, JAIL_JANITOR_INTERVAL)

// start the server
if (NODE_ENV === 'test') {
  APP.listen(PORT,  () => {
    log(`Prokurilo DEV running on ${os.hostname()}`, LogLevel.INFO, true);
  })
} else {
  try {
    log(`Prokurilo PROD running on ${os.hostname()}`, LogLevel.INFO, true);
    const HTTPS_SERVER = https.createServer({
      key: fs.readFileSync(KEY_PATH),
      cert: fs.readFileSync(CERT_PATH)
    }, APP);
    HTTPS_SERVER.listen(PORT, 'localhost'); 
  } catch {
    throw new Error('failed to set https');
  }
}
