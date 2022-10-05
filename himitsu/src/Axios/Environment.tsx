import * as Constants from '../Config/constants';

const dev = {
  prokurilo: 'localhost:38083',
  relay: 'localhost:7777',
  monerod: 'localhost:38081',
};

const prod = {
  prokurilo: localStorage.getItem(Constants.HIMITSU_RPC_HOST),
  relay: 'localhost:7777',
  monerod: localStorage.getItem(Constants.HIMITSU_MONEROD_HOST),
};

export const environment = Constants.IS_DEV ? dev : prod;
