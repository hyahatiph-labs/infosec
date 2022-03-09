import { createGlobalState } from 'react-hooks-global-state';
import * as Constants from './Config/constants';
import * as Interfaces from './Config/interfaces';

const subAddressInit: Interfaces.Address[] = [];
const contactInit: Interfaces.Contact[] = [];
const transferInit: Interfaces.Transfer[] = [];
const host = localStorage.getItem(Constants.HIMITSU_RPC_HOST);

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
    walletBalance: BigInt(0),
    unlockedBalance: BigInt(0),
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
    network: '', // TODO: add MAINNET, STAGENET enum / flags
    rpcHost: host || 'localhost:38083',
  },
  transfer: {
    transferList: transferInit,
  },
});
