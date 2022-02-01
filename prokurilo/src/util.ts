import axios from 'axios'
import { 
  ANTI_SPAM_THRESHOLD,
  Asset, ASSET_HOST, Config, Http,
  JailedToken, TPAT, XMR_RPC_HOST 
} from './config'
import log, { LogLevel } from './logging'
import { getConfigs } from './setup'
import crypto from 'crypto'

export const jail: JailedToken[] = [];

/**
 * Hash the signature and store hash temporarily
 * for anti-spam measures.
 * @param proof - signature from reserve proof
 */
const jailToken = (proof: string): void => {
  const timestamp = Date.now()
  const hash = crypto.createHash('sha256')
  hash.update(proof);
  const signature = hash.copy().digest('hex')
  jail.push({ timestamp, signature })
}

/**
 * Check jail (cache) for a signature hash
 * @param proof - reserve proof signature
 * @returns - boolean
 */
const isJailed = (proof: string): boolean => {
  const hash = crypto.createHash('sha256')
  hash.update(proof);
  const h_signature = hash.copy().digest('hex')
  jail.forEach(j => {
    if (j.signature === h_signature) {
      return true;
    }
  })
  return false;
}

/**
 * Validate uri requested against documented assets
 * @param uri - uri of asset
 * @returns Asset
 */
const validateAsset = (uri: string): Asset => {
  log(`validate asset for uri: ${uri}`, LogLevel.DEBUG, true);
  const sConfig: string = getConfigs().toString();
  const assets: Asset[] = JSON.parse(sConfig).assets;
  let vAsset;
  assets.forEach(a => {
    if (a.uri === uri) {
      vAsset = a;
    }
  })
  return vAsset;
}

/**
 * Helper function for parsing the hash, signature etc. from header
 * @param {String} tpat - transaction proof authentication token 
 * @returns {Object} data with hash and signature
 */
 const parseHeader = (tpat: string) : TPAT | null => {
   log(`tpat: ${tpat}`, LogLevel.DEBUG, true);
    try {
      const hash = tpat ? tpat.split("TPAT ")[1].split(":")[0] : ""
      const signature = tpat ? tpat.split("TPAT ")[1].split(":")[1] : ""
      const subaddress_override = tpat ? tpat.split("TPAT ")[1].split(":")[2] : ""
      const isSubAddressOverride = subaddress_override !== null
        && subaddress_override !== undefined && subaddress_override !== ""
      const isValid = tpat !== undefined && tpat !== null 
        && hash !== undefined && hash !== null && hash !== ""
        && signature !== undefined && signature !== null && signature !== ""
        && tpat.indexOf("TPAT") > -1
      if (isValid) {
        return { 
          hash, min_amt: 0, signature, ttl: 0, 
          subaddress: isSubAddressOverride ? subaddress_override : "" 
        }
      }
      return null
    } catch {
      return null
    }
  }
  
  /**
   * Helper function for return header in the response 
   */
  const returnHeader = (parsedHeader: TPAT, req: any, res: any): void => {
    const h = validateAsset(req.url);
    if (parsedHeader === null) {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${h.subaddress}", ` +
        `min_amt="${h.amt}", ttl="${h.ttl}", hash="", signature="", ast="${ANTI_SPAM_THRESHOLD}"`).send()
    } else {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${h.subaddress}", ` + 
        `min_amt="${h.amt}", ttl="${h.ttl}", hash="${parsedHeader.hash}",` +
        `signature="${parsedHeader.signature}", ast="${ANTI_SPAM_THRESHOLD}"`).send()
    }
  }
  
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
    // check the proof
    const values = parseHeader(req.headers[Config.AUTHORIZATION])
    if (values === null) {
      returnHeader(values, req, res)
    } else {
      const h = validateAsset(req.url)
      const oa = req.body.prokurilo_subaddress_ovverride
      const ioa = oa !== null && oa !== undefined && oa !== "" && h.override
      const body = {
        jsonrpc: Config.RPC_VERSION,
        id: Config.RPC_ID,
        method: Config.RPC_CHECK_TX_PROOF,
        params: {
          address: ioa ? oa : h.subaddress, 
          txid: values.hash, 
          signature: values.signature
        }
      }
      axios
        .post(`http://${XMR_RPC_HOST}/json_rpc`, body)
        .then((rp) => {
          const p = rp.data.result
          log(`rpc response: ${JSON.stringify(p)}`, LogLevel.DEBUG, false);
            /* 
              Validations:
                1. signature is valid or "good"
                2. the transaction is broadcasted - not in pool
                3. confirmations are not past the threshold the default is 30 blocks or about an hour
                   the transaction proof can be used like a ticket until that threshold. The MIN_AMOUNT
                   get one hour, doubling get two hours time-to-live etc.
            */
          const isValidTTL = Math.floor(p.received / h.amt) * h.ttl > p.confirmations
          const isFree = isJailed(values.signature)
          log(`ttl value: ${Math.floor(p.received / h.amt) * h.ttl}`, LogLevel.DEBUG, true);
          if (p.good === false || p.in_pool === true || !isValidTTL || !isFree) {
            returnHeader(values, req, res)
          } else {
            // jail token
            jailToken(values.signature)
            // check the uri
            if (req.method === 'GET') {
              axios.get(`http://${ASSET_HOST}${req.url}`, req.body)
                .then(v => res.json(v.data))
                .catch(v => res.json(v))
            } else if (req.method === 'POST') {
                axios.post(`http://${ASSET_HOST}${req.url}`, req.body)
                  .then(v => res.json(v.data))
                  .catch(v => res.json(v))
            } else if (req.method === 'PATCH') {
                axios.patch(`http://${ASSET_HOST}${req.url}`, req.body)
                  .then(v => res.json(v.data))
                  .catch(v => res.json(v))
            } else if (req.method === 'DELETE') {
                axios.delete(`http://${ASSET_HOST}${req.url}`, req.body)
                  .then(v => res.json(v.data))
                  .catch(v => res.json(v))
            }
          }
        }).catch(() => res.status(Http.SERVER_FAILURE).json({ message: "Proof generation failure" }))
      }
}

export default isValidProof;
