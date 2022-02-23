/* eslint-disable camelcase */
// Global interfaces are exported from here

export interface RequestContext {
    jsonrpc: string
    id: string
    method: string
}
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
}

/* RPC Request Parameter Interfacess */
interface CreateWalletParams {
    filename: string
    password: string
    language: string
}

interface RestoreDeterministicParams {
    filename: string
    password: string
    language: string
    seed: string
}

interface QueryKeyParams {
    key_type: string
}

interface ShowBalanceParams {
    account_index: number
    address_indices: number[]
}

interface CreateAddressParams {
    account_index: number
    label: string
}

export type ShowAddressParams = ShowBalanceParams;

/* RPC Request Interfaces */
export interface CreateWalletRequest extends RequestContext {
    params: CreateWalletParams
}

export interface RestoreDeterministicRequest extends RequestContext {
    params: RestoreDeterministicParams
}

export interface QueryKeyRequest extends RequestContext {
    params: QueryKeyParams
}

export interface ShowBalanceRequest extends RequestContext {
    params: ShowBalanceParams
}

export interface ShowAddressRequest extends RequestContext {
    params: ShowBalanceParams
}

export interface CreateAddressRequest extends RequestContext {
    params: CreateAddressParams
}

/* RPC Response Interfaces */
interface SubAddressBalance {
    account_index: number
    address: string
    address_index: number
    balance: number
    blocks_to_unlock: number
    label: string
    num_unspent_outputs: number
    time_to_unlock: number
    unlocked_balance: number
}

interface ShowBalanceResult {
    balance: number
    blocks_to_unlock: number
    multisig_import_needed: boolean
    per_subaddress: SubAddressBalance[]
    time_to_unlock: number
    unlocked_balance: number
}

export interface Address {
    address: string
    address_index: number
    label: string
    used: boolean
}

interface ShowAddressResult {
    address: string
    addresses: Address[]
}

interface CreateAddressResult {
    address: string
    address_index: number
}

interface QueryKeyResult {
    key: string
}

export interface ShowBalanceResponse extends RequestContext {
    result: ShowBalanceResult
}

export interface ShowAddressResponse extends RequestContext {
    result: ShowAddressResult
}

export interface CreateAddressResponse extends RequestContext {
    result: CreateAddressResult
}

export interface QueryKeyResponse extends RequestContext {
    result: QueryKeyResult
}
