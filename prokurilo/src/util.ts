/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import * as Config from "./config";
import log, { LogLevel } from "./logging";
import { getConfigs, getDemoStaticFiles } from "./setup";
import crypto from "crypto";
import path from 'path';

export const jail: Config.JailedToken[] = [];
const NODE_ENV = process.env.NODE_ENV || "";
let himitsuConfigured = false;
let addressIsSet = false;
let himitsuAddress = '';
let data = crypto.randomBytes(32).toString();
let lastKnownSignature = '';
const setLastKnownSignature = (s: string) => { lastKnownSignature = s; }

const verifyHimitsuSignature = async (address: string, signature: string): Promise<boolean> => {
  const body = {
    jsonrpc: Config.RPC.VERSION,
    id: Config.RPC.ID,
    method: Config.RPC.VERIFY,
    params: { address, data, signature },
  };
  return await axios
    .post(`http://${Config.XMR_RPC_HOST}/json_rpc`, body)
    .then((v) => { return v.data.result.good; })
    .catch(() => {
      log(`rpc failure`, LogLevel.ERROR, true);
      return false;
    });
}

/**
 * Use one time challenge to configure himitsu.
 * 1. Start monero-wallet-rpc
 * 2. Start prokurilo with --himitsu-rpc-restrict flag
 * 3. On wallet initialization Himitsu will request the challenge
 *    from prokurilo. It will then take the challenge and use
 *    it as data for signing.
 * 5. On the initial request himitsu fails with 403 and 
 *     challenge response. Next it sends primary address and
 *    signature for validation.
 * 6. Set himitsu configured and challenge address
 * 7. New challenge generated on each request with 403
 * 8. Continue to send signature to match challenge for each additional auth
 * NOTE: An attacker would somehow need to get the challenge which is
 * not possible because a new 32-byte challenge is generated on each request.
 * Himitsu does not store this challenge, nor does prokurilo store the signature which has yet
 * to be generated*. The only way to gain access to the new signature is to 
 * gain physical access to the device on which himitsu is running.
 * To mitigate, himitsu has a password lock screen which with a secure enough
 * password makes the wallet inaccessible. There is also an additional pin-to-send
 * feature in which the pin is not stored on the device. Only the hash of it.
 * basic <address:signature> on the first request "handshake"
 * basic <h(address):signature> SHA-256 hash of address on all subsequent requests
 * * last known signature is kept for re-signings
 * @param auth - basic auth for himitsu
 */
const configureHimitsu = async (auth: string, req: any, res: any) => {
  const address = auth.split("basic ")[1].split(":")[0];
  const signature = auth.split("basic ")[1].split(":")[1];
  if (await verifyHimitsuSignature(address, signature) && addressIsSet) {
    log(`configuring himitsu instance`, LogLevel.INFO, true);
    himitsuAddress = address;
    himitsuConfigured = true;
    // clear the challenge to start the regeneration process on subsequent verifications
    data = null;
    setLastKnownSignature(signature);
    res.status(Config.Http.OK).send();
  } else if (!addressIsSet || req.body.method === 'sign') {
    log(`bypass for signing only`, LogLevel.WARN, true);
    passThrough(req, res, null); // one time deal for the handshake
    addressIsSet = !addressIsSet ? req.body.method === 'get_address' : addressIsSet;
  } else {
    log(`himitsu configuration failure`, LogLevel.ERROR, true);
    res
      .status(Config.Http.FORBIDDEN)
      .header("www-authenticate", `challenge=${data}`)
      .send();
  }
};

const verifyHimitsu = async (auth:string, req: any, res: any) => {
  const address = auth.split("basic ")[1].split(":")[0];
  const signature = auth.split("basic ")[1].split(":")[1];
  const hAddress = crypto.createHash('sha256');
  hAddress.update(himitsuAddress);
  const isKnown = address === hAddress.digest('hex') && lastKnownSignature === signature;
  log(`verifying himitsu instance`, LogLevel.INFO, true);
  if (await verifyHimitsuSignature(himitsuAddress, signature) && data !== null) {
    passThrough(req, res, null);
    data = null; // reset challenge
  } else if (req.body.method === 'sign' && isKnown && data !== null) {
      // pass through to sign after challenge set
      passThrough(req, res, null);
  } else {
    log(`himitsu verification failure`, LogLevel.ERROR, true);
    data = crypto.randomBytes(32).toString(); // create new challenge
    res
      .status(Config.Http.FORBIDDEN)
      .header("www-authenticate", `challenge=${isKnown ? data : ''}`)
      .send();
  }
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
  } else if (NODE_ENV === "test" && req.url !== "/" && !h) {
    res.sendFile(path.join(__dirname, "../examples/static", req.url.replace("/", "")));
  } else if ((!h || h.static) || (h && h.static)) { // static or redirects
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

// TODO: implement custom messages update js doc

/**
 * @param {Object} tpat - transaction proof authentication token
 * Object parsed from the www-authenticate header.
 * Format is 'www-authenticate: TPAT address="<recipient_address>"",
 *  min_amount="<minimum_amount_piconero>", ttl="<confirmations>",
 *  hash="<transaction_hash>", signature="<transaction_proof>", ast="<60>"'
 * @returns
 */
export const isValidProof = (req: any, res: any): void => {
  log(`request body: ${JSON.stringify(req.body)}`, LogLevel.DEBUG, false);
  const authHeader = req.headers[Config.Header.AUTHORIZATION];
  // check for bypass, always bypass home (login?) page
  if (bypassAsset(req) || req.url === "/") {
    passThrough(req, res, null);
  } else if (Config.HIMITSU_RESTRICTED && !himitsuConfigured) {
    configureHimitsu(authHeader, req, res);
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
  axios.get('http://localhost:7657/tunnels')
      .then(v => {
          const status = v.data.split('<h4><span class="tunnelBuildStatus">')[1].split('</span></h4>')[0]
          const ACCEPTING_TUNNELS = 'Accepting tunnels'
          const REJECTING_TUNNELS = 'Rejecting tunnels: Starting up'
          if (status === ACCEPTING_TUNNELS) {
              log('i2p is active', LogLevel.INFO, true);
          } else if (status === REJECTING_TUNNELS) {
              log('i2p is starting up', LogLevel.INFO, true);
          } else {
              log('no i2p connection', LogLevel.INFO, true);
          }
      })
      .catch(() => { throw new Error('I2P check failed. Are you sure, it is running?') })
};

export default isValidProof;
