import axios from 'axios';
import crypto from 'crypto';
import * as Axios from './Axios/Clients';
import * as Constants from './Config/constants';
import * as Interfaces from './Config/interfaces';

let retry = 0;
/**
 * Wrapper to authenticate with prokurilo and set the signature for
 * all rpc requests.
 * @param address - primary address
 * @param isInitial - boolean to use address for initial prokurilo handshake
 */
export const authenticate = async (address: string | null, isInitial: boolean): Promise<void> => {
  // use challenge to generate signature
  // retry with signature
  if (!Constants.IS_DEV) {
    await Axios.RPC.post(Constants.JSON_RPC, {})
      .catch(async (e) => {
        const authHeader: string = JSON.parse(JSON.stringify(e)).config.headers['www-authenticate'];
        const challenge = authHeader.split('challenge=')[1];
        const sBody: Interfaces.SignRequest = Constants.SIGN_REQUEST;
        sBody.params.data = challenge || '';
        const sign: Interfaces.SignResponse = await (
          await Axios.RPC.post(Constants.JSON_RPC, sBody)
        ).data;
        const sig = sign.result.signature;
        const hash = crypto.createHash('sha256');
        hash.update(address || '');
        let auth = `${hash.digest('hex')}:${sig}`;
        if (isInitial) {
          // use the address on initial configuration
          auth = `${address}:${sig}`;
        }
        // set the auth globally;
        axios.defaults.headers.post.Authorization = `basic ${auth}`;
        // trigger initial handshake
        if (isInitial) {
          const vBody = Constants.GET_VERSION_REQUEST;
          const result = await Axios.RPC.post(Constants.JSON_RPC, vBody);
          if (result.status !== Constants.HTTP_OK && retry < 1) {
            // retry logic
            authenticate(address, true);
            retry += 1;
          }
        }
      });
  }
};
