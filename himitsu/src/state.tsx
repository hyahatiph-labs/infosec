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
    rpcUserName: 'himitsu',
    rpcPassword: 'himitsu',
    rpcHost: 'http://localhost:38083',
    // TODO: wallet naming convention
    walletName: '',
    walletPassword: '',
    seed: '',
    network: '', // TODO: add MAINNET, STAGENET enum / flags
    wallet: {},
  },
});
