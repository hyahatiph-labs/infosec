import axios from 'axios'
import { ALLOWED_URIS, ASSET, Config, Data, Http, XMR_RPC_HOST } from './config'
import log, { LogLevel } from './logging'

/**
 * Helper function for parsing the hash, signature etc. from header
 * @param {String} tpat - transaction proof authentication token 
 * @returns {Object} data with hash and signature
 */
 const parseHeader = (tpat: string) : Data | null => {
    try {
      const hash = tpat ? tpat.split(/hash="(.*)"/g)[1].split('"')[0] : ""
      const signature = tpat ? tpat.split(/signature="(.*)"/g)[1].split('"')[0] : ""
      const min_amt: string = tpat ? tpat.split(/min_amount="(.*)"/g)[1].split('"')[0] : ""
      const ttl: string = tpat ? tpat.split(/ttl="(.*)"/g)[1].split('"')[0] : ""
      const subaddress: string = tpat ? tpat.split(/address="(.*)"/g)[1].split('"')[0] : ""
      const isValid = tpat !== undefined && tpat !== null 
        && hash !== undefined && hash !== null && hash !== ""
        && signature !== undefined && signature !== null && signature !== ""
        && tpat.indexOf("TPAT") > -1
      if (isValid) {
        return {
          hash, 
          min_amt: parseInt(min_amt), 
          signature, 
          ttl: parseInt(ttl), 
          subaddress
        }
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
  const returnHeader = (parsedHeader: Data, res: any): void => {
    if (parsedHeader === null) {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${parsedHeader.subaddress}", ` +
        `min_amt="${parsedHeader.min_amt}", ttl="${parsedHeader.min_amt}", hash="", signature=""`).send()
    } else {
      res.status(Http.PAYMENT_REQUIRED).header('www-authenticate', `TPAT address="${parsedHeader.subaddress}", ` + 
        `min_amt="${parsedHeader.min_amt}", ttl="${parsedHeader.min_amt}", ` + 
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
    const values = parseHeader(req.header[Config.WWW_AUTHENTICATE])
    if (values === null) {
      returnHeader(values, res)
    } else {
      const body = {
        jsonrpc: Config.RPC_VERSION,
        id: Config.RPC_ID,
        method: Config.RPC_METHOD,
        params: {
          address: values.subaddress, 
          txid: values.hash, 
          signature: values.signature
        }
      }
      axios
        .post(`http://${XMR_RPC_HOST}/json_rpc`, body)
        .then((rp) => {
          const p = rp.data.result
          log(`DEBUG => rpc response: ${JSON.stringify(p)}`, LogLevel.DEBUG, false);
            /* 
              Validations:
                1. signature is valid or "good"
                2. the transaction is broadcasted - not in pool
                3. confirmations are not past the threshold the default is 30 blocks or about an hour
                   the transaction proof can be used like a ticket until that threshold. The MIN_AMOUNT
                   get one hour, doubling get two hours time-to-live etc.
            */
          const isValidTTL = Math.floor(p.received / values.min_amt) 
              * values.ttl > p.confirmations
          if (p.good === false || p.in_pool === true || !isValidTTL) {
            returnHeader(values, res)
          } else {
            // check the uri
            if (!ALLOWED_URIS.indexOf(req.url)) {
              res.status(Http.BAD_REQUEST).json({ msg: "Invalid URI scheme" })
            }
            if (req.method === 'GET') {
              axios.get(`${ASSET}${req.url}`, req.body)
                .then(v => res.json(v))
                .catch(v => res.json(v))
            } else if (req.method === 'POST') {
                axios.post(`${ASSET}${req.url}`, req.headers, req.body)
                  .then(v => res.json(v))
                  .catch(v => res.json(v))
            } else if (req.method === 'PATCH') {
                axios.patch(`${ASSET}${req.url}`, req.headers, req.body)
                  .then(v => res.json(v))
                  .catch(v => res.json(v))
            } else if (req.method === 'DELETE') {
                axios.delete(`${ASSET}${req.url}`, req.body)
                  .then(v => res.json(v))
                  .catch(v => res.json(v))
            }
          }
        }).catch(() => res.status(Http.SERVER_FAILURE).json({ message: "Proof generation failure" }))
      }
}

export default isValidProof;
