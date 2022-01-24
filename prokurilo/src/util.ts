import axios from 'axios'
import { Asset, ASSET_HOST, Config, Http, TPAT, XMR_RPC_HOST } from './config'
import log, { LogLevel } from './logging'
import { getConfigs } from './setup'

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
      const hash = tpat ? tpat.split(/hash="(.*)"/g)[1].split('"')[0] : ""
      const signature = tpat ? tpat.split(/signature="(.*)"/g)[1].split('"')[0] : ""
      const isValid = tpat !== undefined && tpat !== null 
        && hash !== undefined && hash !== null && hash !== ""
        && signature !== undefined && signature !== null && signature !== ""
        && tpat.indexOf("TPAT") > -1
      if (isValid) {
        return { hash, min_amt: 0, signature, ttl: 0, subaddress: "" }
      }
      return null
    } catch {
      return null
    }
  }
  
  /**
   * Helper function for return header in the response 
   * TODO: login page for static content
   */
  const returnHeader = (parsedHeader: TPAT, req: any, res: any): void => {
    const h = validateAsset(req.url);
    if (parsedHeader === null) {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${h.subaddress}", ` +
        `min_amt="${h.amt}", ttl="${h.ttl}", hash="", signature=""`).send()
    } else {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${h.subaddress}", ` + 
        `min_amt="${h.amt}", ttl="${h.ttl}", ` + 
        `hash="${parsedHeader.hash}", signature="${parsedHeader.signature}"`).send()
    }
  }
  
  // TODO: implement custom messages update js doc
  
  /**
   * @param {Object} tpat - transaction proof authentication token
   * Object parsed from the www-authenticate header.
   * Format is 'www-authenticate: TPAT address="<recipient_address>"", 
   *  min_amount="<minimum_amount_piconero>", ttl="<confirmations>",
   *  hash="<transaction_hash>", signature="<transaction_proof>"'
   * @returns 
   */
  const isValidProof = (req: any, res: any): void => {
    // check the proof
    const values = parseHeader(req.headers[Config.WWW_AUTHENTICATE])
    if (values === null) {
      returnHeader(values, req, res);
    } else {
      const h = validateAsset(req.url);
      const body = {
        jsonrpc: Config.RPC_VERSION,
        id: Config.RPC_ID,
        method: Config.RPC_CHECK_TX_PROOF,
        params: {
          address: h.subaddress, 
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
          log(`ttl value: ${Math.floor(p.received / h.amt) * h.ttl}`, LogLevel.DEBUG, true);
          if (p.good === false || p.in_pool === true || !isValidTTL) {
            returnHeader(values, req, res)
          } else {
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
