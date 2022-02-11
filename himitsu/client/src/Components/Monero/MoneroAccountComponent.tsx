import React, { ReactElement, useState, useEffect } from 'react';
import axios from 'axios';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import { Tooltip } from '@material-ui/core';
import { setGlobalState, useGlobalState } from '../../state';
import { PICO, PROXY } from '../../Config/constants';

// load balance once
let loaded = false;

const MoneroAccountComponent: React.FC = (): ReactElement => {
  const [gBalance] = useGlobalState('balance');
  const [gInit] = useGlobalState('init');
  // snackbar  const [openError, setOpenError] = useState(false);
  const [copy, setCopy] = useState(false);
  const handleCopy = (): void => { setCopy(!copy); };
  const loadXmrBalance = async (): Promise<void> => {
    const body = { name: gInit.walletName, key: gInit.walletPassword };
    await axios
      .post(`${PROXY}/monero/balance`, body)
      .then((res) => {
        setGlobalState('balance', {
          primaryAddress: res.data.primaryAddress,
          walletBalance: res.data.balance,
          unlockTime: 0,
          unlockedBalance: res.data.balance, // TODO: get unlocked vs locked
          subAddresses: [],
        });
        loaded = true;
      }).catch(() => { /* TODO: and snackbar for error handling */ });
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
