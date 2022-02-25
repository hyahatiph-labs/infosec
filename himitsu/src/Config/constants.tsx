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
  method: 'create_wallet',
  params: {
    password: '',
    filename: '',
    language: 'English',
  },
};

export type OpenWalletRequest = Interfaces.CreateWalletRequest;

export const RESTORE_DETERMINISTIC_REQUEST: Interfaces.RestoreDeterministicRequest = {
  ...context,
  method: 'restore_deterministic_wallet',
  params: {
    password: '',
    filename: '',
    language: '',
    seed: '',
  },
};

export const QUERY_KEY_REQUEST: Interfaces.QueryKeyRequest = {
  ...context,
  method: 'query_key',
  params: {
    key_type: 'mnemonic',
  },
};

export const SHOW_BALANCE_REQUEST: Interfaces.ShowBalanceRequest = {
  ...context,
  method: 'get_balance',
  params: {
    account_index: 0,
    address_indices: [],
  },
};

export const SHOW_ADDRESS_REQUEST: Interfaces.ShowAddressRequest = {
  ...context,
  method: 'get_address',
  params: {
    account_index: 0,
    address_indices: [],
  },
};

export const CREATE_ADDRESS_REQUEST: Interfaces.CreateAddressRequest = {
  ...context,
  method: 'create_address',
  params: {
    account_index: 0,
    label: '',
  },
};

export const VALIDATE_ADDRESS_REQUEST: Interfaces.ValidateAddressRequest = {
  ...context,
  method: 'validate_address',
  params: {
    address: '',
    any_net_type: true,
    allow_openalias: true,
  },
};

export const TRANSFER_REQUEST: Interfaces.TransferRequest = {
  ...context,
  method: 'transfer',
  params: {
    destinations: [],
    priority: 2,
    ring_size: 11,
  },
};

export const GET_ADDRESS_BOOK_REQUEST: Interfaces.GetAddressBookRequest = {
  ...context,
  method: 'get_address_book',
  params: {
    entries: [],
  },
};

export const ADD_ADDRESS_BOOK_REQUEST: Interfaces.AddAddressBookRequest = {
  ...context,
  method: 'add_address_book',
  params: {
    address: '',
    description: '',
  },
};

export const DELETE_ADDRESS_BOOK_REQUEST: Interfaces.DeleteAddressBookRequest = {
  ...context,
  method: 'delete_address_book',
  params: {
    index: 0,
  },
};
