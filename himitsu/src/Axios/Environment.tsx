import * as Constants from '../Config/constants';

const dev = {
  prokurilo: 'http://localhost: 38083',
  monerod: 'http://localhost: 380831',
};

const prod = {
  prokurilo: localStorage.getItem(Constants.HIMITSU_RPC_HOST),
  monerod: localStorage.getItem(Constants.HIMITSU_MONEROD_HOST),
};

export const environment = Constants.IS_DEV ? dev : prod;
