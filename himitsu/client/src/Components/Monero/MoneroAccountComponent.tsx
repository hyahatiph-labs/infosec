import React, { ReactElement, useEffect } from 'react';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import { setGlobalState, useGlobalState } from '../../state';
import { PICO, PROXY } from '../../Config/constants';

// load balance once
let loaded = false;

const MoneroAccountComponent: React.FC = (): ReactElement => {
  const [gBalance] = useGlobalState('balance');
  const [gInit] = useGlobalState('init');
  const loadXmrBalance = async (): Promise<void> => {
    const body = { name: gInit.walletName, key: gInit.walletPassword };
    await axios
      .post(`${PROXY}/monero/balance`, body)
      .then((res) => {
        setGlobalState('balance', {
          primaryAddress: res.data.primaryAddress,
          walletBalance: res.data.balance,
          unlockTime: 0,
          unlockedBalance: res.data.balance,
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
      <h2 color="#212D36">
        {`${gBalance.primaryAddress.slice(0, 9)}...`}
      </h2>
      <h4>{`*${(pendingBalance / PICO).toFixed(6)} (pending XMR)`}</h4>
      <h4>{`Time to unlock: ~${unlockTime} min.`}</h4>
      <div>
        <Button variant="outlined" color="primary">Send</Button>
        <Button variant="outlined" color="primary">Receive</Button>
      </div>
    </div>
  );
};

export default MoneroAccountComponent;
