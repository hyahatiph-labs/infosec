import React, { ReactElement, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { Tooltip } from '@material-ui/core';
import { setGlobalState, useGlobalState } from '../../state';
import { PICO } from '../../Config/constants';
import * as xmrjs from '../../monero-javascript-0.6.4/index.js';

// load balance once
let loaded = false;
const isDev = process.env.REACT_APP_HIMITSU_DEV === 'DEV';
const MoneroAccountComponent: React.FC = (): ReactElement => {
  const [gBalance] = useGlobalState('balance');
  const [gInit] = useGlobalState('init');
  const [copy, setCopy] = useState(false);

  const handleCopy = (): void => { setCopy(!copy); };

  const loadXmrBalance = async (): Promise<void> => {
    let wallet;
    if (isDev) {
      wallet = await xmrjs.connectToWalletRpc('http://localhost:38083', 'himitsu', 'himitsu');
      await wallet.openWallet('himitsu', 'himitsu');
    } else {
      wallet = await gInit.wallet;
    }
    const primaryAddress = await wallet.getPrimaryAddress();
    const balance = await wallet.getBalance();
    setGlobalState('balance', {
      primaryAddress,
      walletBalance: balance,
      unlockTime: 0,
      unlockedBalance: balance, // TODO: get unlocked vs locked
      subAddresses: [],
    });
    loaded = true;
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gBalance.walletBalance - gBalance.unlockedBalance;
  const unlockTime = gBalance.unlockTime * 2;
  return (
    <div>
      <h1 color="#FF5722">
        {`${((gBalance.walletBalance - pendingBalance) / PICO).toFixed(6)} XMR`}
      </h1>
      <Tooltip title="click to copy address">
        <CopyToClipboard text={gBalance.primaryAddress}>
          <QRCode
            value={gBalance.primaryAddress}
            onClick={handleCopy}
          />
        </CopyToClipboard>
      </Tooltip>
      <h4>{`*${(pendingBalance / PICO).toFixed(6)} (pending XMR)`}</h4>
      <h4>{`Time to unlock: ~${unlockTime} min.`}</h4>
      <Snackbar open={copy} autoHideDuration={2000} onClose={handleCopy}>
        <Alert onClose={handleCopy} severity="success">
          Address copied to clipboard
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MoneroAccountComponent;
