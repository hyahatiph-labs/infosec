import { createGlobalState } from 'react-hooks-global-state';
import { CONFIG_HASH } from './Config/constants';
import * as Interfaces from './Config/interfaces';

const subAddressInit: Interfaces.Address[] = [];
const contactInit: Interfaces.Contact[] = [];
const transferInit: Interfaces.Transfer[] = [];
const configHash = localStorage.getItem(CONFIG_HASH);

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
    subAddresses: subAddressInit,
    mnemonic: '',
  },
  contact: {
    contactList: contactInit,
  },
  init: {
    isWalletInitialized: false,
    isRestoringFromSeed: false,
    isSeedConfirmed: false,
    walletName: '',
    walletPassword: '',
    network: '', // TODO: add MAINNET, STAGENET enum / flags
    rpcHost: 'localhost:38083',
    pin: '',
    configHash,
  },
  transfer: {
    transferList: transferInit,
  },
});
