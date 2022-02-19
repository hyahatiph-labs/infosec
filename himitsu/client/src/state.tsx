import { createGlobalState } from 'react-hooks-global-state';

/**
 * Global state management
 */
export const {
  useGlobalState,
  setGlobalState,
  getGlobalState,
} = createGlobalState({
  account: {
    primaryAddress: '',
    walletBalance: 0,
    unlockedBalance: 0,
    unlockTime: 0,
    subAddresses: [],
    mnemonic: '',
  },
  init: {
    isWalletInitialized: false,
    walletName: '',
    walletPassword: '',
    network: '', // TODO: add MAINNET, STAGENET enum / flags
  },
});
