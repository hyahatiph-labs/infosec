/* eslint-disable camelcase */
// Global interfaces are exported from here

export interface RequestContext {
  jsonrpc: string;
  id: string;
  method: string;
}

// Complex Component State
export interface WalletInitState {
  url: string | null;
  walletPassword: string;
  walletName: string;
  showPassword: boolean;
  isInitializing: boolean;
  isAdvanced: boolean;
  rpcUserName: string | null;
  rpcPassword: string | null;
  seed: string;
  networkType: string;
  mode: string;
  height: string;
}

export interface AccountState {
  label: string;
  amount: number;
  sendTo: string;
  hash: string;
}

export interface ContactState {
  address: string;
  amount: number;
  name: string;
}

/* RPC Request Parameter Interfaces */
interface CreateWalletParams {
  filename: string;
  password: string;
  language: string;
}

interface RestoreDeterministicParams {
  filename: string;
  password: string;
  language: string;
  seed: string;
}

interface QueryKeyParams {
  key_type: string;
}

interface ShowBalanceParams {
  account_index: number;
  address_indices: number[];
}

interface CreateAddressParams {
  account_index: number;
  label: string;
}

interface ValidateAddressParams {
  address: string;
  any_net_type: boolean;
  allow_openalias: boolean;
}

export interface Destination {
  amount: number;
  address: string;
}

interface TransferParams {
  destinations: Destination[];
  priority: number;
  ring_size: number;
}

interface GetAddressBookParams {
  entries: number[];
}

interface AddAddressBookParams {
  address: string;
  description: string;
}

interface DeleteAddressBookParams {
  index: number;
}

export type ShowAddressParams = ShowBalanceParams;

/* RPC Request Interfaces */
export interface CreateWalletRequest extends RequestContext {
  params: CreateWalletParams;
}

export interface RestoreDeterministicRequest extends RequestContext {
  params: RestoreDeterministicParams;
}

export interface QueryKeyRequest extends RequestContext {
  params: QueryKeyParams;
}

export interface ShowBalanceRequest extends RequestContext {
  params: ShowBalanceParams;
}

export interface ShowAddressRequest extends RequestContext {
  params: ShowBalanceParams;
}

export interface CreateAddressRequest extends RequestContext {
  params: CreateAddressParams;
}

export interface ValidateAddressRequest extends RequestContext {
  params: ValidateAddressParams;
}

export interface TransferRequest extends RequestContext {
  params: TransferParams;
}

export interface GetAddressBookRequest extends RequestContext {
  params: GetAddressBookParams
}

export interface AddAddressBookRequest extends RequestContext {
  params: AddAddressBookParams;
}

export interface DeleteAddressBookRequest extends RequestContext {
  params: DeleteAddressBookParams;
}

/* RPC Result Interfaces */
interface SubAddressBalance {
  account_index: number;
  address: string;
  address_index: number;
  balance: number;
  blocks_to_unlock: number;
  label: string;
  num_unspent_outputs: number;
  time_to_unlock: number;
  unlocked_balance: number;
}

interface ShowBalanceResult {
  balance: number;
  blocks_to_unlock: number;
  multisig_import_needed: boolean;
  per_subaddress: SubAddressBalance[];
  time_to_unlock: number;
  unlocked_balance: number;
}

export interface Address {
  address: string;
  address_index: number;
  label: string;
  used: boolean;
}

interface ShowAddressResult {
  address: string;
  addresses: Address[];
}

interface CreateAddressResult {
  address: string;
  address_index: number;
}

interface ValidateAddressResult {
  valid: boolean;
  integrated: boolean;
  subaddress: boolean;
  nettype: string;
  openalias_address: boolean;
}

interface QueryKeyResult {
  key: string;
}

interface TransferResult {
  tx_hash: string;
}

export interface Contact {
  address: string;
  description: string;
  index: number;
  payment_id: string;
}

interface GetAddressBookResult {
  entries: Contact[]
}

interface AddAddressBookResult {
  index: number;
}

/* RPC Response Interfaces */
export interface ShowBalanceResponse extends RequestContext {
  result: ShowBalanceResult;
}

export interface ShowAddressResponse extends RequestContext {
  result: ShowAddressResult;
}

export interface CreateAddressResponse extends RequestContext {
  result: CreateAddressResult;
}

export interface ValidateAddressResponse extends RequestContext {
  result: ValidateAddressResult;
}

export interface QueryKeyResponse extends RequestContext {
  result: QueryKeyResult;
}

export interface TransferResponse extends RequestContext {
  result: TransferResult;
}

export interface GetAddressBookResponse extends RequestContext {
  result: GetAddressBookResult;
}

export interface AddAddressBookResponse extends RequestContext {
  result: AddAddressBookResult
}
