import * as Interfaces from './interfaces';

export {};
export const PICO = 1000000000000;
export const HTTP_OK = 200;

/* RPC Request constants */
const context: Interfaces.RequestContext = {
  jsonrpc: '2.0',
  id: '0',
  method: '',
};

export const CREATE_WALLET_REQUEST: Interfaces.CreateWalletRequest = {
  ...context,
  params: {
    password: '',
    filename: '',
    language: 'English',
  },
};

export type OpenWalletRequest = Interfaces.CreateWalletRequest;

export const RESTORE_DETERMINISTIC_REQUEST: Interfaces.RestoreDeterministicRequest = {
  ...context,
  params: {
    password: '',
    filename: '',
    language: '',
    seed: '',
  },
};

export const QUERY_KEY_REQUEST: Interfaces.QueryKeyRequest = {
  ...context,
  params: {
    key_type: '',
  },
};

export const SHOW_BALANCE_REQUEST: Interfaces.ShowBalanceRequest = {
  ...context,
  params: {
    account_index: 0,
    address_indices: [],
  },
};

export const SHOW_ADDRESS_REQUEST: Interfaces.ShowAddressRequest = {
  ...context,
  params: {
    account_index: 0,
    address_indices: [],
  },
};

export const CREATE_ADDRESS_REQUEST: Interfaces.CreateAddressRequest = {
  ...context,
  params: {
    account_index: 0,
    label: '',
  },
};
