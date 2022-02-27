/* eslint-disable camelcase */
// Global interfaces are exported from here

export interface RequestContext {
  jsonrpc: string;
  id: string;
  method: string;
}

// Complex Component State
export interface WalletInitState {
  url: string;
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
  height: number;
}

export interface AccountState {
  pin: number;
  label: string;
  amount: number;
  sendTo: string;
  hash: string;
  reserveProof: string;
  message: string;
  proofValidation: CheckReserveProofResult;
}

export interface TransactionState {
  txid: string;
  address: string;
  txProof: string;
  message: string;
  proofValidation: CheckTxProofResult;
}

export interface ContactState {
  address: string;
  amount: number;
  name: string;
}

export interface SettingsState {
  oldPin: string;
  pin: number;
  rpcHost: string;
}

/* RPC Request Parameter Interfaces */
interface CreateWalletParams {
  filename: string;
  password: string;
  language: string;
}

interface RestoreDeterministicParams extends CreateWalletParams {
  seed: string;
  restore_height: number;
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

interface ShowTransfersParams {
  failed: boolean;
  in: boolean;
  out: boolean;
  pending: boolean;
  pool: boolean;
  account_index: number;
}

interface GetReserveProofParams {
  all: boolean;
  account_index: number;
  amount: number;
  message: string;
}

interface CheckReserveProofParams {
  address: string;
  message: string;
  signature: string;
}

interface GetTxProofParams {
  address: string;
  txid: string;
  message: string;
}

interface CheckTxProofParams {
  address: string;
  txid: string;
  message: string;
  signature: string;
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

export interface ShowTransfersRequest extends RequestContext {
  params: ShowTransfersParams;
}

export interface GetReserveProofRequest extends RequestContext {
  params: GetReserveProofParams;
}

export interface CheckReserveProofRequest extends RequestContext {
  params: CheckReserveProofParams;
}

export interface GetTxProofRequest extends RequestContext {
  params: GetTxProofParams;
}

export interface CheckTxProofRequest extends RequestContext {
  params: CheckTxProofParams;
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

interface SubAddressIndex {
  major: number;
  minor: number;
}

export interface Transfer {
  address: string;
  amount: number;
  amounts: number[];
  confirmations: number;
  double_spend_seed: boolean;
  fee: number;
  height: number;
  locked: false;
  note: string;
  payment_id: string;
  subaddr_index: SubAddressIndex;
  subaddr_indices: SubAddressIndex[];
  suggested_confirmations_threshold: number;
  timestamp: number;
  txid: string;
  type: string;
  unlockTime: number;
}

interface ShowTransferResult {
  failed: Transfer[];
  in: Transfer[];
  pending: Transfer[];
  pool: Transfer[];
  out: Transfer[];
}

interface GetReserveProofResult {
  signature: string;
}

export type GetTxProofResult = GetReserveProofResult

export interface CheckReserveProofResult {
  good: boolean;
  spent: number;
  total: number;
}

export interface CheckTxProofResult {
  confirmations: number;
  good: boolean;
  in_pool: boolean;
  received: number;
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

export interface ShowTransfersResponse extends RequestContext {
  result: ShowTransferResult;
}

export interface GetReserveProofResponse extends RequestContext {
  result: GetReserveProofResult;
}

export interface CheckReserveProofResponse extends RequestContext {
  result: CheckReserveProofResult;
}

export interface GetTxProofResponse extends RequestContext {
  result: GetTxProofResult;
}

export interface CheckTxProofResponse extends RequestContext {
  result: CheckTxProofResult;
}
