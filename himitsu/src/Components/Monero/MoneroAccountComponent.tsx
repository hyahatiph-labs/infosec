import React, { ReactElement, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
  Fade, Tooltip, Button, Typography, TextField,
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import clsx from 'clsx';
import axios from 'axios';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import SendIcon from '@material-ui/icons/Send';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import { setGlobalState, useGlobalState } from '../../state';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';

// TODO: Refactor all modals to separate components

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
  qr: {
    marginLeft: theme.spacing(5),
  },
  icon: {
    margin: theme.spacing(0.5),
    backgroundColor: '#212D362',
    color: '#FF5277',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#212D362',
    color: '#FF5277',
  },
  info: {
    marginLeft: theme.spacing(3),
    color: '#FF5277',
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
  const [subAddressUpdated, setSubAddressUpdated] = useState(false);
  const [unusedAddressAlert, setUnusedAddressAlert] = useState(false);
  const [isSeedConfirmed, setSeedConfirmed] = useState(false);
  const [isGeneratingSubAddress, setIsGeneratingSubAddress] = useState(false);
  const [addressTooltip, setAddressTooltip] = useState('Click to recent unused address');
  const [addressLabel, setAddressLabel] = useState('');
  const host = `${gInit.rpcHost}/json_rpc`;

  const handleCopy = (): void => { setCopy(!copy); };

  const handleSubAddressUpdate = (): void => {
    setSubAddressUpdated(!subAddressUpdated);
    setIsGeneratingSubAddress(false);
  };

  const handleUnusedAddressAlert = (): void => { setUnusedAddressAlert(!unusedAddressAlert); };

  const handleChange = () => (event:React.ChangeEvent<HTMLInputElement>) => {
    setAddressLabel(event.target.value);
  };

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
      const aResult = a.result.addresses;
      const aLength = aResult.length;
      // display the latest unused subaddress, warn if all addresses are used
      const primaryAddress = aLength <= 1 ? a.result.address : aResult[aLength - 1].address;
      const { balance } = b.result;
      const unlockedBalance = b.result.unlocked_balance;
      setGlobalState('account', {
        primaryAddress,
        walletBalance: balance,
        unlockTime: b.result.blocks_to_unlock,
        unlockedBalance,
        subAddresses: a.result.addresses,
        mnemonic: gAccount.mnemonic,
      });
      let unusedAddress = false;
      aResult.forEach((v) => { if (!v.used && v.address_index !== 0) { unusedAddress = true; } });
      if (!unusedAddress) { handleUnusedAddressAlert(); }
      loaded = true;
    }
  };

  const getSubAddress = async (): Promise<void> => {
    let unusedAddressExists = false;
    gAccount.subAddresses.forEach((v) => {
      if (!v.used && v.address_index !== 0) {
        setGlobalState('account', { ...gAccount, primaryAddress: v.address });
        unusedAddressExists = true;
        handleSubAddressUpdate();
      }
    });
    if (!unusedAddressExists) {
      setIsGeneratingSubAddress(true);
    }
  };

  const generateSubAddress = async (): Promise<void> => {
    const aBody: Interfaces.CreateAddressRequest = Constants.CREATE_ADDRESS_REQUEST;
    const sBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
    aBody.method = 'create_address';
    sBody.method = 'get_address';
    aBody.params.label = addressLabel;
    const create: Interfaces.CreateAddressResponse = await (await axios.post(host, aBody)).data;
    const show: Interfaces.ShowAddressResponse = await (await axios.post(host, sBody)).data;
    const newAddress = create.result.address;
    const showResult = show.result.addresses;
    setAddressTooltip(`Click to copy ${showResult[showResult.length - 1].label}`);
    setGlobalState('account', {
      ...gAccount,
      primaryAddress: newAddress,
      subAddresses: showResult,
    });
    handleSubAddressUpdate();
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gAccount.walletBalance - gAccount.unlockedBalance;
  const unlockTime = gAccount.unlockTime * 2;
  return (
    <div className={classes.root}>
      { !gInit.isRestoringFromSeed
        && (
        // Seed confirmation modal
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
      {/* Generate new subaddress modal */}
      { isGeneratingSubAddress
        && (
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={isGeneratingSubAddress}
            closeAfterTransition
          >
            <Fade in={isGeneratingSubAddress}>
              <div className={classes.paper}>
                <h2 id="transition-modal-title">
                  Create a label
                </h2>
                <p id="transition-modal-description">
                  A new subaddress is generated when all available have been used
                </p>
                <TextField
                  label="subaddress label"
                  id="standard-start-adornment"
                  className={clsx(classes.margin, classes.textField)}
                  onChange={handleChange()}
                />
                <br />
                <Button
                  className={classes.send}
                  onClick={() => { generateSubAddress(); }}
                  variant="outlined"
                  color="primary"
                >
                  Generate
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      <h2 className={classes.info}>
        {`${((gAccount.walletBalance - pendingBalance) / Constants.PICO).toFixed(9)} XMR`}
      </h2>
      <div className={classes.qr}>
        <Tooltip title={addressTooltip}>
          <CopyToClipboard text={gAccount.primaryAddress}>
            <QRCode
              value={gAccount.primaryAddress}
              onClick={handleCopy}
            />
          </CopyToClipboard>
        </Tooltip>
      </div>
      <h3 className={classes.info}>
        {`*${(pendingBalance / Constants.PICO).toFixed(3)} (pending XMR)`}
      </h3>
      <h3 className={classes.info}>{`Time to unlock: ~${unlockTime} min.`}</h3>
      <Button
        className={classes.send}
        onClick={() => { handleSeedConfirmation(); }}
        variant="outlined"
        color="primary"
        size="medium"
      >
        <SendIcon className={classes.icon} />
        Send
      </Button>
      <Button
        className={classes.send}
        onClick={() => { getSubAddress(); }}
        variant="outlined"
        color="primary"
        size="medium"
      >
        <CallReceivedIcon className={classes.icon} />
        Receive
      </Button>
      <Snackbar open={copy} autoHideDuration={2000} onClose={handleCopy}>
        <Alert onClose={handleCopy} severity="success">
          Address copied to clipboard
        </Alert>
      </Snackbar>
      <Snackbar open={subAddressUpdated} autoHideDuration={10000} onClose={handleSubAddressUpdate}>
        <Alert
          onClose={handleSubAddressUpdate}
          severity={isGeneratingSubAddress ? 'success' : 'info'}
        >
          {isGeneratingSubAddress
            ? 'Subaddress generated successfully '
            : 'You have an unused subaddress '}
          click the QRCode to copy it
        </Alert>
      </Snackbar>
      <Snackbar
        open={unusedAddressAlert}
        autoHideDuration={10000}
        onClose={handleUnusedAddressAlert}
      >
        <Alert
          onClose={handleUnusedAddressAlert}
          severity="warning"
        >
          Press &apos;receive&apos; to generate a new subaddress.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MoneroAccountComponent;
