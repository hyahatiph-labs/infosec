import React, { ReactElement, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
  Fade, Tooltip, Button, Typography,
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { setGlobalState, useGlobalState } from '../../state';
import { PICO } from '../../Config/constants';
import * as xmrjs from '../../monero-javascript-0.6.4/index.js';

const useStyles = makeStyles((theme: Theme) => createStyles({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    fontSize: '20px',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
}));

// load balance once
let loaded = false;
const isDev = process.env.REACT_APP_HIMITSU_DEV === 'DEV';
const MoneroAccountComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gAccount] = useGlobalState('account');
  const [gInit] = useGlobalState('init');
  const [copy, setCopy] = useState(false);
  const [isSeedConfirmed, setSeedConfirmed] = useState(false);

  const handleCopy = (): void => { setCopy(!copy); };

  const handleSeedConfirmation = (): void => {
    setSeedConfirmed(true);
    setGlobalState('account', {
      ...gAccount,
      mnemonic: '',
    });
  };

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
    const mnemonic = await wallet.getMnemonic();
    setGlobalState('account', {
      primaryAddress,
      walletBalance: balance,
      unlockTime: 0,
      unlockedBalance: balance, // TODO: get unlocked vs locked
      subAddresses: [],
      mnemonic,
    });
    loaded = true;
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gAccount.walletBalance - gAccount.unlockedBalance;
  const unlockTime = gAccount.unlockTime * 2;
  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={!isSeedConfirmed && gInit.isWalletInitialized}
        closeAfterTransition
      >
        <Fade in={!isSeedConfirmed && gInit.isWalletInitialized}>
          <div className={classes.paper}>
            <h2 id="transition-modal-title">
              Press &quot;CONFIRM&quot; after securing your mnemonic
            </h2>
            <p id="transition-modal-description">
              Seed phrase:
            </p>
            <br />
            <Typography>{gAccount.mnemonic}</Typography>
            <Button
              onClick={() => { handleSeedConfirmation(); }}
              variant="outlined"
              color="primary"
            >
              Confirm
            </Button>
          </div>
        </Fade>
      </Modal>
      <h1 color="#FF5722">
        {`${((gAccount.walletBalance - pendingBalance) / PICO).toFixed(6)} XMR`}
      </h1>
      <Tooltip title="click to copy address">
        <CopyToClipboard text={gAccount.primaryAddress}>
          <QRCode
            value={gAccount.primaryAddress}
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
