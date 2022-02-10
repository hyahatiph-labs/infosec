import { createGlobalState } from 'react-hooks-global-state';

/**
 * Global state management
 */
export const {
  useGlobalState,
  setGlobalState,
  getGlobalState,
} = createGlobalState({
  balance: {
    primaryAddress: '',
    walletBalance: 0,
    unlockedBalance: 0,
    unlockTime: 0,
    subAddresses: [],
  },
  init: {
    isWalletInitialized: false,
    rpcUserName: '',
    rpcPassword: '',
    proxyUrl: 'http://localhost:18083',
    // TODO: wallet naming convention
    walletName: '',
    walletPassword: '',
    seed: '',
    network: '',
  },
});
