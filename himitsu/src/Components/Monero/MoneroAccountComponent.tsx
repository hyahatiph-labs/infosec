import React, { ReactElement, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
  Fade, Tooltip, Button, Typography,
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import axios from 'axios';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { setGlobalState, useGlobalState } from '../../state';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';

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
  const host = `${gInit.rpcHost}/json_rpc`;
  const handleCopy = (): void => { setCopy(!copy); };

  const handleSeedConfirmation = (): void => {
    setSeedConfirmed(true);
    setGlobalState('account', {
      ...gAccount,
      mnemonic: '',
    });
  };

  const loadXmrBalance = async (): Promise<void> => {
    const body: Constants.OpenWalletRequest = Constants.CREATE_WALLET_REQUEST;
    if (isDev) {
      body.method = 'open_wallet';
      body.params.filename = 'himitsu';
      body.params.password = 'himitsu';
    } else {
      body.params.filename = gInit.walletName;
      body.params.password = gInit.walletPassword;
    }
    const oResult = await axios.post(host, body);
    if (oResult.status === Constants.HTTP_OK) {
      const aBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
      aBody.method = 'get_address';
      const bBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
      bBody.method = 'get_balance';
      const a: Interfaces.ShowAddressResponse = await (await axios.post(host, aBody)).data;
      const b: Interfaces.ShowBalanceResponse = await (await axios.post(host, bBody)).data;
      const primaryAddress = a.result.address;
      const { balance } = b.result;
      const unlockedBalance = b.result.unlocked_balance;
      setGlobalState('account', {
        primaryAddress,
        walletBalance: balance,
        unlockTime: b.result.time_to_unlock, // TODO: get unlock block time
        unlockedBalance, // TODO: get unlocked vs locked
        subAddresses: [],
        mnemonic: gAccount.mnemonic,
      });
      loaded = true;
    }
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gAccount.walletBalance - gAccount.unlockedBalance;
  const unlockTime = gAccount.unlockTime * 2;
  return (
    <div>
      { !gInit.isRestoringFromSeed
        && (
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
        )}
      <h1 color="#FF5722">
        {`${((gAccount.walletBalance - pendingBalance) / Constants.PICO).toFixed(6)} XMR`}
      </h1>
      <Tooltip title="click to copy address">
        <CopyToClipboard text={gAccount.primaryAddress}>
          <QRCode
            value={gAccount.primaryAddress}
            onClick={handleCopy}
          />
        </CopyToClipboard>
      </Tooltip>
      <h4>{`*${(pendingBalance / Constants.PICO).toFixed(6)} (pending XMR)`}</h4>
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
