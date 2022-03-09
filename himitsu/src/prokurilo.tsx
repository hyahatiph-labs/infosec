import * as Axios from './Axios/Clients';
import * as Constants from './Config/constants';
import * as Interfaces from './Config/interfaces';

/**
 * Wrapper to authenticate with prokurilo and set the signature for
 * all rpc requests.
 * @param address - primary address
 * @returns expire - the expiration time of the cookie in milliseconds
 */
export const authenticate = async (address: string | null): Promise<number> => {
  // use challenge to generate signature
  if (!Constants.IS_DEV) {
    return Axios.RPC.post(Constants.JSON_RPC, {})
      .then(() => '')
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
        const expire = await (
          await Axios.RPC.post(Constants.JSON_RPC, vBody, { headers })
        ).data.expire;
        Axios.RPC.defaults.headers.himitsu = `${address}:${sig}`;
        localStorage.setItem(Constants.HIMITSU_INIT, `${Date.now()}`);
        return expire;
      });
  }
  return 0;
};
