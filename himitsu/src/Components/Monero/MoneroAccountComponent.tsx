import React, { ReactElement, useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
  Fade, Button, Typography, TextField,
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import clsx from 'clsx';
import axios from 'axios';
import SendIcon from '@material-ui/icons/Send';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import {
  AddCircle,
  Check, CloseRounded, HourglassEmpty, HourglassFull, LockOpen, SendRounded,
} from '@material-ui/icons';
import { setGlobalState, useGlobalState } from '../../state';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import { useStyles } from './styles';
import busy from '../../Assets/dance.gif';

// TODO: tx / reserve proof generation
// TODO: create wallet locked component and logic / password hashed to local storage

// load balance once
let loaded = false;
const isDev = process.env.REACT_APP_HIMITSU_DEV === 'DEV';
const MoneroAccountComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gAccount] = useGlobalState('account');
  const [gInit] = useGlobalState('init');
  const [isBusy, setIsBusy] = useState(false);
  const [copy, setCopy] = useState(false);
  const [subAddressUpdated, setSubAddressUpdated] = useState(false);
  const [invalidAddress, setIsInvalidAddress] = useState(false);
  const [unusedAddressAlert, setUnusedAddressAlert] = useState(false);
  const [isGeneratingSubAddress, setIsGeneratingSubAddress] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setIsTransferSuccess] = useState(false);
  const [invalidAmount, setIsInvalidAmount] = useState(false);
  const [rpcConnectionFailure, setRpcConnectionFailure] = useState(false);
  const [values, setValues] = React.useState<Interfaces.AccountState>({
    label: '',
    amount: 0,
    sendTo: '',
    hash: '',
  });
  const host = `http://${gInit.rpcHost}/json_rpc`;

  const handleCopy = (): void => { setCopy(!copy); };

  const handleSubAddressUpdate = (): void => {
    setSubAddressUpdated(!subAddressUpdated);
    setIsGeneratingSubAddress(false);
  };

  const handleTransfer = (): void => { setIsTransferring(!isTransferring); };

  const handleTransferSuccess = (): void => {
    setIsTransferSuccess(!transferSuccess);
    setIsTransferring(false);
  };

  const handleInvalidAmount = (): void => { setIsInvalidAmount(!invalidAmount); };

  const handleUnusedAddressAlert = (): void => { setUnusedAddressAlert(!unusedAddressAlert); };

  const handleInvalidAddress = (): void => { setIsInvalidAddress(!invalidAddress); };

  const handleRpcConnectionFailure = (): void => {
    setRpcConnectionFailure(!rpcConnectionFailure);
  };

  const handleChange = (prop: keyof Interfaces.AccountState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleSeedConfirmation = (): void => {
    setGlobalState('init', { ...gInit, isRestoringFromSeed: true });
    setGlobalState('account', { ...gAccount, mnemonic: '' });
  };

  const loadXmrBalance = async (): Promise<void> => {
    setIsBusy(true);
    const body: Constants.OpenWalletRequest = Constants.CREATE_WALLET_REQUEST;
    body.method = 'open_wallet';
    if (isDev) {
      body.params.filename = 'himitsu';
      body.params.password = 'himitsu';
    } else {
      body.params.filename = gInit.walletName;
      body.params.password = gInit.walletPassword;
    }
    try {
      const oResult = await axios.post(host, body);
      if (oResult.status === Constants.HTTP_OK) {
        const aBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
        const bBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
        const a: Interfaces.ShowAddressResponse = await (await axios.post(host, aBody)).data;
        const b: Interfaces.ShowBalanceResponse = await (await axios.post(host, bBody)).data;
        const kBody: Interfaces.QueryKeyRequest = Constants.QUERY_KEY_REQUEST;
        const k: Interfaces.QueryKeyResponse = (await axios.post(host, kBody)).data;
        const aResult = a.result.addresses;
        const aLength = aResult.length;
        // display the latest unused subaddress, warn if all addresses are used
        const primaryAddress = aLength <= 1 ? a.result.address : aResult[aLength - 1].address;
        const { balance } = b.result;
        const unlockedBalance = b.result.unlocked_balance;
        setGlobalState('account', {
          ...gAccount,
          primaryAddress,
          walletBalance: balance,
          unlockTime: b.result.blocks_to_unlock,
          unlockedBalance,
          subAddresses: a.result.addresses,
          mnemonic: k.result.key,
        });
        let unusedAddress = false;
        aResult.forEach((v) => { if (!v.used && v.address_index !== 0) { unusedAddress = true; } });
        if (!unusedAddress) { handleUnusedAddressAlert(); }
        setIsBusy(false);
        loaded = true;
      } else {
        handleRpcConnectionFailure();
      }
    } catch {
      loaded = true;
      handleRpcConnectionFailure();
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
    aBody.params.label = values.label;
    const create: Interfaces.CreateAddressResponse = await (await axios.post(host, aBody)).data;
    const show: Interfaces.ShowAddressResponse = await (await axios.post(host, sBody)).data;
    const newAddress = create.result.address;
    const showResult = show.result.addresses;
    setGlobalState('account', {
      ...gAccount,
      primaryAddress: newAddress,
      subAddresses: showResult,
    });
    handleSubAddressUpdate();
  };

  const transfer = async (): Promise<void> => {
    const vBody: Interfaces.ValidateAddressRequest = Constants.VALIDATE_ADDRESS_REQUEST;
    vBody.params.address = values.sendTo.trim();
    const isValidAmt = values.amount < gAccount.unlockedBalance / Constants.PICO;
    const vAddress: Interfaces.ValidateAddressResponse = await (await axios.post(host, vBody)).data;
    if (vAddress.result.valid && isValidAmt
      && vAddress.result.nettype !== 'mainnet') { // TODO: enable mainnet
      const tBody: Interfaces.TransferRequest = Constants.TRANSFER_REQUEST;
      const destination: Interfaces.Destination = {
        address: values.sendTo.trim(),
        amount: values.amount * Constants.PICO,
      };
      tBody.params.destinations.push(destination);
      const tx: Interfaces.TransferResponse = await (await axios.post(host, tBody)).data;
      setValues({ ...values, hash: tx.result.tx_hash });
      handleTransferSuccess();
      loadXmrBalance();
    }
    if (!vAddress.result.valid || vAddress.result.nettype === 'mainnet') {
      handleInvalidAddress();
    }
    if (!isValidAmt) {
      handleInvalidAmount();
    }
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gAccount.walletBalance - gAccount.unlockedBalance;
  const unlockTime = gAccount.unlockTime * 2;

  return (
    <div className={classes.root}>
      { (!gInit.isRestoringFromSeed && !gInit.isSeedConfirmed)
        && (
        // Seed confirmation modal
        <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={classes.modal}
          open={!gInit.isSeedConfirmed && gInit.isWalletInitialized}
          closeAfterTransition
        >
          <Fade in={!gInit.isSeedConfirmed && gInit.isWalletInitialized}>
            <div className={clsx(classes.paper, 'altBg')}>
              <h2 id="transition-modal-title">
                Press &quot;CONFIRM&quot; after securing your mnemonic
              </h2>
              <Typography>{gAccount.mnemonic}</Typography>
              <Button
                className={classes.send}
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
              <div className={clsx(classes.paper, 'altBg')}>
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
                  onChange={handleChange('label')}
                />
                <br />
                <Button
                  className={classes.send}
                  onClick={() => { generateSubAddress(); }}
                  variant="outlined"
                  color="primary"
                >
                  <AddCircle />
                </Button>
                {' '}
                <Button
                  className={classes.send}
                  onClick={() => { setIsGeneratingSubAddress(false); }}
                  variant="outlined"
                  color="primary"
                >
                  <CloseRounded />
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      {/* Transfer modal */}
      { isTransferring
        && (
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={isTransferring}
            closeAfterTransition
          >
            <Fade in={isTransferring}>
              <div className={clsx(classes.paper, 'altBg')}>
                <h2 id="transition-modal-title">
                  Send moneroj
                </h2>
                <p id="transition-modal-description">
                  Enter amount and destination.
                </p>
                <TextField
                  label="address"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.margin, classes.textField)}
                  onChange={handleChange('sendTo')}
                />
                <TextField
                  label="amount"
                  type="number"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.margin, classes.textField)}
                  onChange={handleChange('amount')}
                />
                <br />
                <Button
                  className={classes.send}
                  disabled={values.amount * Constants.PICO > gAccount.unlockedBalance
                    || values.amount <= 0}
                  onClick={() => { transfer(); }}
                  variant="outlined"
                  color="primary"
                >
                  <SendRounded />
                </Button>
                {' '}
                <Button
                  className={classes.send}
                  onClick={() => { handleTransfer(); }}
                  variant="outlined"
                  color="primary"
                >
                  <CloseRounded />
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      <div className={classes.unlockedBalance}>
        <LockOpen className={classes.icon} />
        <h1>
          {`${((gAccount.walletBalance - pendingBalance) / Constants.PICO).toFixed(3)} XMR`}
        </h1>
      </div>
      <div className={classes.pendingBalance}>
        {((unlockTime > 5 && unlockTime !== 0) && pendingBalance > 0)
          && <HourglassEmpty className={classes.icon} />}
        {((unlockTime <= 5 && unlockTime !== 0) && pendingBalance > 0)
          && <HourglassFull className={classes.icon} />}
        <h3>
          {(pendingBalance > 0 && unlockTime > 0)
            && ` ${(pendingBalance / Constants.PICO).toFixed(3)} ~ ${unlockTime} min.`}
        </h3>
      </div>
      {isBusy
        && (
          <div className={classes.qr}>
            <img loading="lazy" src={busy} alt="monero logo" width={200} />
          </div>
        )}
      {!isBusy
        && (
          <div className={classes.qr}>
            <CopyToClipboard text={gAccount.primaryAddress}>
              <QRCode
                value={gAccount.primaryAddress}
                onClick={handleCopy}
              />
            </CopyToClipboard>
          </div>
        )}
      <div className={classes.buttonRow}>
        <Button
          className={classes.send}
          disabled={gAccount.unlockedBalance === 0}
          onClick={() => { handleTransfer(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <SendIcon className={classes.icon} />
        </Button>
        <Button
          className={classes.send}
          onClick={() => { getSubAddress(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <CallReceivedIcon className={classes.icon} />
        </Button>
        <Button
          className={classes.send}
          // onClick={() => { getSubAddress(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <Check className={classes.icon} />
        </Button>
      </div>
      {/* food court! */}
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
            : 'You have an unused subaddress. '}
          Click the QRCode to copy it
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
      <Snackbar
        open={rpcConnectionFailure}
        autoHideDuration={3000}
        onClose={handleRpcConnectionFailure}
      >
        <Alert
          onClose={handleRpcConnectionFailure}
          severity="error"
        >
          Failed to connect to RPC.
        </Alert>
      </Snackbar>
      <Snackbar
        open={invalidAddress}
        autoHideDuration={5000}
        onClose={handleInvalidAddress}
      >
        <Alert
          onClose={handleInvalidAddress}
          severity="error"
        >
          Invalid address! *Sending disabled on mainnet.
        </Alert>
      </Snackbar>
      <Snackbar
        open={transferSuccess}
        autoHideDuration={5000}
        onClose={handleTransferSuccess}
      >
        <Alert
          onClose={handleTransferSuccess}
          severity="success"
        >
          {`Send success for hash: ${values.hash.slice(0, 9)}...`}
        </Alert>
      </Snackbar>
      <Snackbar
        open={invalidAmount}
        autoHideDuration={5000}
        onClose={handleInvalidAmount}
      >
        <Alert
          onClose={handleInvalidAmount}
          severity="error"
        >
          {`${values.amount} is not valid`}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MoneroAccountComponent;
