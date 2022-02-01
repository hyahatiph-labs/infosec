import express from "express";
import helmet from "helmet";
import { ANTI_SPAM_THRESHOLD, JAIL_JANITOR_INTERVAL, PORT } from "./config";
import isValidProof, { jail } from "./util";
import os from "os";
import setup from "./setup";
import log, { LogLevel } from "./logging";

const APP = express();
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
APP.listen(PORT,  () => {
  console.log(`Prokurilo running on ${os.hostname()}`);
})
