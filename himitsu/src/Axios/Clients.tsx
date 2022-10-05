import axios from 'axios';
import { environment } from './Environment';
import * as Constants from '../Config/constants';

export const RPC = axios.create({
  baseURL: `http://${environment.prokurilo}`,
  headers: Constants.IS_DEV ? {} : { proxy: Constants.I2P_PROXY },
});

export const RELAY = axios.create({
  baseURL: `http://${environment.relay}`,
  headers: Constants.IS_DEV ? {} : { proxy: Constants.I2P_PROXY },
});

export const MONEROD = axios.create({
  baseURL: `http://${environment.monerod}`,
  headers: Constants.IS_DEV ? {} : { proxy: Constants.I2P_PROXY },
});
