// Global interfaces are exported from here

export interface Balance {
    primaryAddress: string
    walletBalance: number
    unlockedBalance: number
    unlockTime: number
    subAddresses: string[]
}

export default interface State {
    balance: Balance
};
