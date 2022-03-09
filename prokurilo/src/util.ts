/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import * as Config from "./config";
import log, { LogLevel } from "./logging";
import { getConfigs, getDemoStaticFiles } from "./setup";
import crypto from "crypto";
import path from 'path';
import { i2pJanitor } from "./prokurilo";

export const jail: Config.JailedToken[] = [];

const ACCEPTING_TUNNELS = 'Accepting tunnels'
const REJECTING_TUNNELS = 'Rejecting tunnels: Starting up'
const NODE_ENV = process.env.NODE_ENV || "";

let walletIsSet = false;
let himitsuAuth = '';
let himitsuConfigured = false;
let data = crypto.randomBytes(32).toString('hex');
let i2pKillSwitchCheck = 0;
let i2pStatus = '';
let i2pReconnect = false;
let utilI2pJanitor = setInterval(() => {/* initialize reconnect janitor for event loop */}, 0);

const verifyHimitsuSignature = async (address: string, signature: string): Promise<boolean> => {
  const body = {
    jsonrpc: Config.RPC.VERSION,
    id: Config.RPC.ID,
    method: Config.RPC.VERIFY,
    params: { address, data, signature },
  };
  try {
    const sResponse = await (await axios.post(`http://${Config.XMR_RPC_HOST}/json_rpc`, body)).data;
    return sResponse.result.good;
  } catch {
    return false;
  }
}

/**
 * Use one time challenge to configure himitsu.
 * 1. Start monero-wallet-rpc
 * 2. Start prokurilo with --himitsu-rpc-restrict flag
 * 3. On wallet initialization Himitsu will request the challenge
 *    from prokurilo. It will then take the challenge and use
 *    it as data for signing.
 * 4. On the initial request himitsu fails with 403 and 
 *     challenge response. Next it sends primary address and
 *    signature for validation.
 * 5. Set himitsu configured and challenge address
 * 6. New challenge generated on each request with 403
 * 7. Continue to send signature to match challenge for each additional auth
 * NOTE: An attacker would somehow need to get the challenge which is
 * not possible because a new 32-byte challenge is generated on each request.
 * Himitsu does not store this challenge, and the signature is place in a
 * cryptographically signed cookie with the password to maintain the user session. 
 * Himitsu has a password lock screen which with a secure enough
 * password makes the wallet inaccessible.
 * basic <address:signature> on the first request "handshake"
 * * last known signature is kept for re-signings
 * @param auth - basic auth for himitsu
 */
const configureHimitsu = async (auth: string, req: any, res: any) => {
  log(`auth header: ${auth}`, LogLevel.DEBUG, true);
  const parseIt = auth && auth.length > 0 && auth.indexOf(":") > 0 ? auth.split("basic ")[1] : '';
  const address = parseIt !== '' ? parseIt.split(":")[0] : '';
  const signature = parseIt !== '' ? parseIt.split(":")[1] : '';
  if (walletIsSet && address.length > 0 && signature.length > 0) {
    log(`checking signature for configuration`, LogLevel.DEBUG, true);
    if (await verifyHimitsuSignature(address, signature)){
      log(`configuring himitsu instance`, LogLevel.INFO, true);
      himitsuConfigured = true;
      himitsuAuth = signature;
      // clear the challenge to start the regeneration process on subsequent verifications
      data = null;
      // set the himitsu cookie
      res.cookie("himitsu", himitsuAuth);
      res.status(Config.Http.OK).send(); 
    } else {
      log(`himitsu configuration failure`, LogLevel.ERROR, true);
      res
        .status(Config.Http.FORBIDDEN)
        .header("www-authenticate", `challenge=${data}`)
        .send();
    }
  } else if (!walletIsSet || req.body.method === 'sign') {
    log(`bypass for signing only`, LogLevel.WARN, true);
    if (req.body.method === 'create_wallet') {
      log(`wallet is set`, LogLevel.DEBUG, true);
      // set the user cookie
      res.cookie("wallet", req.body);
      walletIsSet = true;
    }
    passThrough(req, res, null); // one time deal for the handshake
  } else {
    log(`himitsu configuration failure`, LogLevel.ERROR, true);
    res
      .status(Config.Http.FORBIDDEN)
      .header("www-authenticate", `challenge=${data}`)
      .send();
  }
};

const verifyHimitsu = async (auth:string, req: any, res: any) => {
  log(`cooke: ${req.cookie.wallet}`, LogLevel.DEBUG, true);
  passThrough(req, res, null);
};

/**
 * Hash the signature and store hash temporarily
 * for anti-spam measures.
 * TODO: this won't scale. Implement MongoDB
 * @param proof - signature from reserve proof
 */
const jailToken = (proof: string): void => {
  const timestamp = Date.now();
  const hash = crypto.createHash("sha256");
  hash.update(proof);
  const signature = hash.copy().digest("hex");
  jail.push({ timestamp, signature });
};

/**
 * Check jail (cache) for a signature hash
 * @param proof - reserve proof signature
 * @returns - boolean
 */
const isJailed = (proof: string): boolean => {
  let match = false;
  const hash = crypto.createHash("sha256");
  hash.update(proof);
  const h_signature = hash.copy().digest("hex");
  if (jail.length === 0) return false;
  jail.forEach((j) => {
    if (j.signature === h_signature) {
      log(`token in jail since ${j.timestamp}`, LogLevel.DEBUG, true);
      match = true;
    }
  });
  return match;
};

/**
 * Validate uri requested against documented assets
 * @param uri - uri of asset
 * @returns Asset
 */
const validateAsset = (uri: string): Config.Asset => {
  log(`validate asset for uri: ${uri}`, LogLevel.DEBUG, true);
  const sConfig: string = getConfigs().toString();
  const assets: Config.Asset[] = JSON.parse(sConfig).assets;
  let vAsset = null;
  assets.forEach((a) => {
    if (a.uri === uri) {
      vAsset = a;
    }
  });
  return vAsset;
};

/**
 * Bypass uri requested against documented assets
 * @param uri - uri of asset
 * @returns Asset
 */
const bypassAsset = (req: any): boolean => {
  log(`checking bypass asset for uri: ${req.url}`, LogLevel.DEBUG, true);
  const sConfig: string = getConfigs().toString();
  const uris: string[] = JSON.parse(sConfig).bypass;
  /* In the demo static content is getting injected from the examples
     This should be ok in order to serve but normally things like images
     won't be on this server.
  */
  const d = getDemoStaticFiles();
  const isDemoContent = Config.LOCAL_HOSTS.indexOf(req.ip) > -1
    && d.indexOf(req.url.replace("/", "")) > -1 && NODE_ENV === 'test';
  return uris.indexOf(req.url) > -1 || isDemoContent;
};

/**
 * Helper function for parsing the hash, signature etc. from header
 * @param {String} tpat - transaction proof authentication token
 * @returns {Object} data with hash and signature
 */
const parseHeader = (tpat: string): Config.TPAT | null => {
  log(`tpat: ${tpat}`, LogLevel.DEBUG, true);
  try {
    let hash;
    let signature;
    let sao;
    if (tpat && tpat.indexOf("tpat ") > -1) {
      hash = tpat.split("tpat ")[1].split(":")[0];
      signature = tpat.split("tpat ")[1].split(":")[1];
      sao = tpat.split("tpat ")[1].split(":")[2];
    }
    if (tpat && tpat.indexOf("TPAT ") > -1) {
      hash = tpat.split("TPAT ")[1].split(":")[0];
      signature = tpat.split("TPAT ")[1].split(":")[1];
      sao = tpat.split("TPAT ")[1].split(":")[2];
    }
    const subaddress_override = sao;
    const isSubAddressOverride =
      subaddress_override !== null &&
      subaddress_override !== undefined &&
      subaddress_override !== "";
    const isValid =
      tpat !== undefined &&
      tpat !== null &&
      hash !== undefined &&
      hash !== null &&
      hash !== "" &&
      signature !== undefined &&
      signature !== null &&
      signature !== "" &&
      tpat.indexOf("TPAT") > -1 || tpat.indexOf("tpat ") > -1;
    if (isValid) {
      return {
        hash,
        min_amt: 0,
        signature,
        ttl: 0,
        subaddress: isSubAddressOverride ? subaddress_override : "",
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Helper function for return header in the response
 * @param parsedHeader
 * @param req
 * @param res
 */
const returnHeader = (parsedHeader: Config.TPAT, req: any, res: any): void => {
  const h = validateAsset(req.url);
  if (parsedHeader === null && h !== null) {
    res
      .status(Config.Http.PAYMENT_REQUIRED)
      .header(
        "www-authenticate",
        `TPAT address="${h.subaddress}", ` +
          `min_amt="${h.amt}", ttl="${h.ttl}", hash="", signature="", ast="${Config.ANTI_SPAM_THRESHOLD}"`
      )
      .send();
  } else if (h === null) {
    res.status(Config.Http.FORBIDDEN).send();
  } else {
    res
      .status(Config.Http.PAYMENT_REQUIRED)
      .header(
        "www-authenticate",
        `TPAT address="${h.subaddress}", ` +
          `min_amt="${h.amt}", ttl="${h.ttl}", hash="${parsedHeader.hash}",` +
          `signature="${parsedHeader.signature}", ast="${Config.ANTI_SPAM_THRESHOLD}"`
      )
      .send();
  }
};

/**
 * Final pass-through to the asset
 * @param req
 * @param res
 */
const passThrough = (req: any, res: any, h: Config.Asset) => {
  if (h && h.static && NODE_ENV === "test") { // demo examples
    res.sendFile(path.join(__dirname, "../examples/static", h.file));
  } else if (NODE_ENV === "test" && req.url === "/") {
    res.sendFile(path.join(__dirname, "../examples/static", "login.html"));
  } else if (NODE_ENV === "test" && req.url !== "/" && !h && !Config.HIMITSU_RESTRICTED) {
    res.sendFile(path.join(__dirname, "../examples/static", req.url.replace("/", "")));
  } else if ((h && h.static)) { // static or redirects
    if (req.method === "GET") {
      axios
        .get(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "POST") {
      axios
        .post(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "PATCH") {
      axios
        .patch(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "DELETE") {
      axios
        .delete(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    }
  }
  else { // return json from protected API handlers
    if (req.method === "GET") {
      axios
        .get(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "POST") {
      axios
        .post(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "PATCH") {
      axios
        .patch(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "DELETE") {
      axios
        .delete(`http://${Config.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    }
  }
};

/**
 * @param {Object} tpat - transaction proof authentication token
 * Object parsed from the www-authenticate header.
 * Format is 'www-authenticate: TPAT address="<recipient_address>"",
 *  min_amount="<minimum_amount_piconero>", ttl="<confirmations>",
 *  hash="<transaction_hash>", signature="<transaction_proof>", ast="<60>"'
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const isValidProof = async (req: any, res: any): Promise<void> => {
  const authHeader = req.headers[Config.Header.AUTHORIZATION];
  // check for bypass, always bypass home (login?) page
  if (bypassAsset(req) || req.url === "/") {
    passThrough(req, res, null);
  } else if (Config.HIMITSU_RESTRICTED && !himitsuConfigured) {
    await configureHimitsu(authHeader, req, res);
  } else if (Config.HIMITSU_RESTRICTED && himitsuConfigured) {
    verifyHimitsu(authHeader, req, res);
  } else {
    // check the proof
    const h = validateAsset(req.url);
    const values = parseHeader(authHeader);
    if (values === null && !h) {
      returnHeader(values, req, res);
    } else {
      let oa;
      try {
        oa = req.body.tpat_subaddress_override;
      } catch {
        oa = null;
      }
      const ioa = oa !== null && oa !== undefined && oa !== "" && h.override;
      const sig = h.static ? req.body.tpat_tx_proof : values.signature;
      const body = {
        jsonrpc: Config.RPC.VERSION,
        id: Config.RPC.ID,
        method: Config.RPC.CHECK_TX_PROOF,
        params: {
          address: ioa ? oa : h.subaddress,
          txid: h.static ? req.body.tpat_tx_hash : values.hash,
          signature: sig,
        },
      };
      axios
        .post(`http://${Config.XMR_RPC_HOST}/json_rpc`, body)
        .then((rp) => {
          const p = rp.data.result;
          log(`rpc response: ${JSON.stringify(p)}`, LogLevel.DEBUG, false);
          /* 
          Validations:
            1. signature is valid or "good"
            2. the transaction is broadcasted - not in pool
            3. confirmations are not past the threshold the default is 30 blocks or about an hour
               the transaction proof can be used like a ticket until that threshold. The MIN_AMOUNT
               get one hour, doubling get two hours time-to-live etc.
        */
          const isValidTTL =
            Math.floor(p.received / h.amt) * h.ttl > p.confirmations;
          const isNotFree = isJailed(sig);
          log(
            `ttl value: ${Math.floor(p.received / h.amt) * h.ttl}, ` +
            `isValid: ${isValidTTL}, isJailed: ${isNotFree}`,
            LogLevel.DEBUG,
            true
          );
          if (
            p.good === false ||
            p.in_pool === true ||
            !isValidTTL ||
            isNotFree
          ) {
            returnHeader(values, req, res);
          } else {
            // jail token
            jailToken(sig);
            // pass response
            passThrough(req, res, h);
          }
        })
        .catch(() =>
          res
            .status(Config.Http.SERVER_FAILURE)
            .json({ message: "Proof validation failure" })
        );
    }
  }
};

/**
 * This is some really hacky logic for killing prokurilo
 * if it is not running over i2p.
 */
export const i2pCheck = (): void => {
    getI2pStatus()
      .catch(() => { 
        // kill the currently running janitor
        clearInterval(i2pJanitor);
        if (i2pReconnect) {
          clearInterval(utilI2pJanitor);
        }
        log(`i2p is connection lost`, LogLevel.ERROR, true );
        log(
          `prokurilo will disconnect in ${(Config.I2P_KILL_SWITCH_LIMIT - 1) - i2pKillSwitchCheck} minutes`,
          LogLevel.WARN, true
        );
        log(`please restart i2p`, LogLevel.INFO, true );
        // this is some kind of quasi-task executor that kill the server
        // if i2p is down for more than twenty minutes
        if (i2pKillSwitchCheck === 0) {
          const i2pKillSwitch = setInterval(() => {
            getI2pStatus(); // the kill switch logic needs to get its own status
            i2pKillSwitchCheck += 1;
            log(`executing i2p check ${i2pKillSwitchCheck}/${Config.I2P_KILL_SWITCH_LIMIT - 1}`, LogLevel.INFO, true);
            if (i2pKillSwitchCheck === Config.I2P_KILL_SWITCH_LIMIT) {
              process.exit(Config.I2P_OFFLINE_ERROR);
            }
            if (i2pStatus === ACCEPTING_TUNNELS) {
              log(`i2p connection re-established`, LogLevel.INFO, true);
              i2pKillSwitchCheck = 0; // back on-line reset the check
              i2pReconnect = true;
              log(`initialized new i2p janitor`, LogLevel.INFO, true);
              // start a new janitor
              utilI2pJanitor = setInterval(() => { i2pCheck(); }, Config.I2P_CHECK_INTERVAL);
              clearInterval(i2pKillSwitch);
            }
          }, Config.I2P_CHECK_INTERVAL)
        }
      })
};

const getI2pStatus = () => axios.get('http://localhost:7657/tunnels')
.then(v => {
  i2pStatus = v.data.split('<h4><span class="tunnelBuildStatus">')[1].split('</span></h4>')[0]
  if (i2pStatus === ACCEPTING_TUNNELS) {
    log('i2p is active', LogLevel.INFO, true);
  } else if (i2pStatus === REJECTING_TUNNELS) {
    log('i2p is starting up', LogLevel.INFO, true);
  } else {
      log('no i2p connection', LogLevel.INFO, true);
  }
})

export default isValidProof;
