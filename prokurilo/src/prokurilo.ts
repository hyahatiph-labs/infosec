import express from "express";
import helmet from "helmet";
import { PORT } from "./config";
import isValidProof from "./util";
import os from "os";
import setup from "./setup";

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

// start the server
APP.listen(PORT,  () => {
  console.log(`Prokurilo running on ${os.hostname()}`);
})
