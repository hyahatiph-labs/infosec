import axios from "axios";
import * as CONFIG from "./config";
import log, { LogLevel } from "./logging";
import { getConfigs, getDemoStaticFiles } from "./setup";
import crypto from "crypto";
import path from 'path';

export const jail: CONFIG.JailedToken[] = [];
const NODE_ENV = process.env.NODE_ENV || "";

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
  const hash = crypto.createHash("sha256");
  hash.update(proof);
  const h_signature = hash.copy().digest("hex");
  if (jail.length === 0) return true;
  jail.forEach((j) => {
    if (j.signature === h_signature) {
      return false;
    }
  });
  return true;
};

/**
 * Validate uri requested against documented assets
 * @param uri - uri of asset
 * @returns Asset
 */
const validateAsset = (uri: string): CONFIG.Asset => {
  log(`validate asset for uri: ${uri}`, LogLevel.DEBUG, true);
  const sConfig: string = getConfigs().toString();
  const assets: CONFIG.Asset[] = JSON.parse(sConfig).assets;
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
  const isDemoContent = CONFIG.LOCAL_HOSTS.indexOf(req.ip) > -1
    && d.indexOf(req.url.replace("/", "")) > -1 && NODE_ENV === 'test';
  return uris.indexOf(req.url) > -1 || isDemoContent;
};

/**
 * Helper function for parsing the hash, signature etc. from header
 * @param {String} tpat - transaction proof authentication token
 * @returns {Object} data with hash and signature
 */
const parseHeader = (tpat: string): CONFIG.TPAT | null => {
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
const returnHeader = (parsedHeader: CONFIG.TPAT, req: any, res: any): void => {
  const h = validateAsset(req.url);
  if (parsedHeader === null && h !== null) {
    res
      .status(CONFIG.Http.PAYMENT_REQUIRED)
      .header(
        "www-authenticate",
        `TPAT address="${h.subaddress}", ` +
          `min_amt="${h.amt}", ttl="${h.ttl}", hash="", signature="", ast="${CONFIG.ANTI_SPAM_THRESHOLD}"`
      )
      .send();
  } else if (h === null) {
    res.status(CONFIG.Http.FORBIDDEN).send();
  } else {
    res
      .status(CONFIG.Http.PAYMENT_REQUIRED)
      .header(
        "www-authenticate",
        `TPAT address="${h.subaddress}", ` +
          `min_amt="${h.amt}", ttl="${h.ttl}", hash="${parsedHeader.hash}",` +
          `signature="${parsedHeader.signature}", ast="${CONFIG.ANTI_SPAM_THRESHOLD}"`
      )
      .send();
  }
};

/**
 * Final pass-through to the asset
 * @param req
 * @param res
 */
const passThrough = (req: any, res: any, h: CONFIG.Asset) => {
  if (h && h.static && NODE_ENV === "test") { // demo examples
    res.sendFile(path.join(__dirname, "../examples/static", h.file));
  } else if (NODE_ENV === "test" && req.url === "/") {
    res.sendFile(path.join(__dirname, "../examples/static", "login.html"));
  } else if (NODE_ENV === "test" && req.url !== "/" && !h) {
    res.sendFile(path.join(__dirname, "../examples/static", req.url.replace("/", "")));
  } else if ((!h || h.static) || (h && h.static)) { // static or redirects
    if (req.method === "GET") {
      axios
        .get(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "POST") {
      axios
        .post(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "PATCH") {
      axios
        .patch(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => {
          const html = v.data.replace("\n", "");
          res.send(html);
        })
        .catch((v) => res.json(v));
    } else if (req.method === "DELETE") {
      axios
        .delete(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
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
        .get(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "POST") {
      axios
        .post(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "PATCH") {
      axios
        .patch(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
        .then((v) => res.json(v.data))
        .catch((v) => res.json(v));
    } else if (req.method === "DELETE") {
      axios
        .delete(`http://${CONFIG.ASSET_HOST}${req.url}`, req.body)
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
const isValidProof = (req: any, res: any): void => {
  log(`request body: ${JSON.stringify(req.body)}`, LogLevel.DEBUG, false);
  // check for bypass, always bypass home (login?) page
  if (bypassAsset(req) || req.url === "/") {
    passThrough(req, res, null);
  } else {
    // check the proof
    const h = validateAsset(req.url);
    const values = parseHeader(req.headers[CONFIG.Header.AUTHORIZATION]);
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
        jsonrpc: CONFIG.RPC.VERSION,
        id: CONFIG.RPC.ID,
        method: CONFIG.RPC.CHECK_TX_PROOF,
        params: {
          address: ioa ? oa : h.subaddress,
          txid: h.static ? req.body.tpat_tx_hash : values.hash,
          signature: sig,
        },
      };
      axios
        .post(`http://${CONFIG.XMR_RPC_HOST}/json_rpc`, body)
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
          const isFree = isJailed(sig);
          log(
            `ttl value: ${Math.floor(p.received / h.amt) * h.ttl}, ` +
            `isValid: ${isValidTTL}, isFree: ${isFree}`,
            LogLevel.DEBUG,
            true
          );
          if (
            p.good === false ||
            p.in_pool === true ||
            !isValidTTL ||
            !isFree
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
            .status(CONFIG.Http.SERVER_FAILURE)
            .json({ message: "Proof validation failure" })
        );
    }
  }
};

export default isValidProof;
