import * as Axios from './Axios/Clients';
import * as Constants from './Config/constants';
import * as Interfaces from './Config/interfaces';

/**
 * Wrapper to authenticate with prokurilo and set the signature for
 * all rpc requests.
 * @param address - primary address
 */
export const authenticate = async (address: string | null): Promise<void> => {
  // use challenge to generate signature
  if (!Constants.IS_DEV) {
    Axios.RPC.post(Constants.JSON_RPC, {})
      .catch(async (e) => {
        const parseChallenge = e.response.headers['www-authenticate'];
        const challenge = parseChallenge ? parseChallenge.split('challenge=')[1] : '';
        const sBody: Interfaces.SignRequest = Constants.SIGN_REQUEST;
        sBody.params.data = challenge;
        const sign: Interfaces.SignResponse = await (
          await Axios.RPC.post(Constants.JSON_RPC, sBody)
        ).data;
        const sig = sign.result.signature || '';
        const auth = `basic ${address}:${sig}`;
        // trigger initial handshake
        const headers = { authorization: auth };
        const vBody = Constants.GET_VERSION_REQUEST;
        await Axios.RPC.post(Constants.JSON_RPC, vBody, { headers });
      });
  }
};
