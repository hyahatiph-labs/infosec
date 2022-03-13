import React, { ReactElement, useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import BigDecimal from 'js-big-decimal';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import QRCode from 'qrcode.react';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import {
  Fade, Button, Typography, TextField,
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import clsx from 'clsx';
import SendIcon from '@material-ui/icons/Send';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import * as MuIcons from '@material-ui/icons';
import * as AxiosClients from '../../Axios/Clients';
import { setGlobalState, useGlobalState } from '../../state';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import { useStyles } from './styles';
import busyDev from '../../Assets/dance.gif';
import busyProd from '../../Assets/iluvxmrchan.gif';
import LockScreenComponent from '../Modals/LockScreenComponent';

let loaded = false;
const WalletComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gAccount] = useGlobalState('account');
  const [gInit] = useGlobalState('init');
  const [gLock] = useGlobalState('lock');
  const [isBusy, setIsBusy] = useState(false);
  const [copy, setCopy] = useState(false);
  const [cookies] = useCookies(['himitsu']);
  const [isSending, setIsSending] = useState(false);
  const [subAddressUpdated, setSubAddressUpdated] = useState(false);
  const [invalidAddress, setIsInvalidAddress] = useState(false);
  const [unusedAddressAlert, setUnusedAddressAlert] = useState(false);
  const [isGeneratingSubAddress, setIsGeneratingSubAddress] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [transferSuccess, setIsTransferSuccess] = useState(false);
  const [invalidAmount, setIsInvalidAmount] = useState(false);
  const [rpcConnectionFailure, setRpcConnectionFailure] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [showProofValidation, setShowProofValidation] = useState(false);
  const [unlockState, setUnlockState] = React
    .useState<Interfaces.UnlockState>({ walletName: '', password: '' });
  const [accountState, setAccountState] = React.useState<Interfaces.AccountState>({
    label: '',
    pin: 0,
    amount: 0,
    sendTo: '',
    hash: '',
    reserveProof: '',
    message: '',
    proofValidation: { good: false, spent: 0n, total: 0n },
  });

  const setCookieInHeader = async (): Promise<void> => {
    if (cookies.himitsu) {
      AxiosClients.RPC.defaults.headers.himitsu = `${cookies.himitsu}`;
    }
  };

  const handleCopy = (): void => { setCopy(!copy); };

  const handleSubAddressUpdate = (): void => {
    setSubAddressUpdated(!subAddressUpdated);
    setIsGeneratingSubAddress(false);
  };

  const handleTransfer = (): void => {
    setIsTransferring(!isTransferring);
  };

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

  const handleProofGeneration = (): void => {
    setProofGenerated(!proofGenerated);
  };

  const handleAccountChange = (prop: keyof Interfaces.AccountState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setAccountState({ ...accountState, [prop]: event.target.value });
  };

  const handleSeedConfirmation = (): void => {
    setGlobalState('init', { ...gInit, isSeedConfirmed: true });
    setGlobalState('account', { ...gAccount, mnemonic: '' });
    localStorage.setItem(Constants.SEED_CONFIRMED, `${Date.now()}`);
  };

  const handleIsSending = (): void => {
    setIsSending(!isSending);
  };

  const loadXmrBalance = async (): Promise<void> => {
    setIsBusy(true);
    await setCookieInHeader();
    if (Constants.IS_DEV) {
      const body: Constants.OpenWalletRequest = Constants.CREATE_WALLET_REQUEST;
      body.method = 'open_wallet';
      body.params.filename = 'himitsu';
      body.params.password = 'himitsu';
      await AxiosClients.RPC.post(Constants.JSON_RPC, body);
    }
    try {
      if ((gInit.isSeedConfirmed || Constants.IS_DEV)) {
        const aBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
        const bBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
        await AxiosClients.RPC.post(Constants.JSON_RPC, aBody)
          .then(async (aResponse) => {
            loaded = true;
            const a: Interfaces.ShowAddressResponse = await aResponse.data;
            if (a.result) {
              const vReq: Interfaces.ValidateAddressRequest = Constants.VALIDATE_ADDRESS_REQUEST;
              vReq.params.address = a.result.address;
              const vRes: Interfaces.ValidateAddressResponse = await (
                await AxiosClients.RPC.post(Constants.JSON_RPC, vReq)
              ).data;
              setGlobalState('init', { ...gInit, network: vRes.result.nettype });
              await AxiosClients.RPC.post(Constants.JSON_RPC, bBody)
                .then(async (bResponse) => {
                  const b: Interfaces.ShowBalanceResponse = await bResponse.data;
                  const aResult = a.result.addresses;
                  const aLength = aResult.length;
                  // display the latest unused subaddress, warn if all addresses are used
                  const primaryAddress = aLength <= 1
                    ? a.result.address : aResult[aLength - 1].address;
                  const { balance } = b.result;
                  const unlockedBalance = b.result.unlocked_balance;
                  setGlobalState('account', {
                    ...gAccount,
                    primaryAddress,
                    walletBalance: balance,
                    unlockTime: b.result.blocks_to_unlock,
                    unlockedBalance,
                    subAddresses: a.result.addresses,
                  });
                  let unusedAddress = false;
                  aResult.forEach((v) => {
                    if (!v.used && v.address_index !== 0) { unusedAddress = true; }
                  });
                  if (!unusedAddress) { handleUnusedAddressAlert(); }
                  setGlobalState('lock', { ...gLock, isScreenLocked: false, isProcessing: false });
                  setIsBusy(false);
                })
                .catch((e: Interfaces.ReAuthState) => {
                  setUnlockState({
                    ...unlockState,
                    walletName: e.response.data.himitsuName
                      ? e.response.data.himitsuName : unlockState.walletName,
                  });
                  setGlobalState('lock', {
                    ...gLock,
                    isScreenLocked: true,
                    isProcessing: true,
                    walletName: e.response.data.himitsuName || '',
                  });
                  setIsBusy(false);
                  loaded = true;
                });
            }
          })
          .catch((e: Interfaces.ReAuthState) => {
            setUnlockState({
              ...unlockState,
              walletName: e.response.data.himitsuName
                ? e.response.data.himitsuName : unlockState.walletName,
            });
            setGlobalState('lock', {
              ...gLock,
              isScreenLocked: true,
              isProcessing: true,
              walletName: e.response.data.himitsuName || '',
            });
            setIsBusy(false);
            loaded = true;
          });
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
    aBody.params.label = accountState.label;
    const create: Interfaces.CreateAddressResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, aBody)
    ).data;
    const show: Interfaces.ShowAddressResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, sBody)
    ).data;
    const newAddress = create.result.address;
    const showResult = show.result.addresses;
    setGlobalState('account', {
      ...gAccount,
      primaryAddress: newAddress,
      subAddresses: showResult,
    });
    handleSubAddressUpdate();
  };

  const generateReserveProof = async (): Promise<void> => {
    setProofGenerated(true);
    const proofBody: Interfaces.GetReserveProofRequest = Constants.GET_RESERVE_PROOF_REQUEST;
    proofBody.params.amount = BigInt(accountState.amount * Constants.PICO).toString();
    proofBody.params.message = accountState.message;
    const proof: Interfaces.GetReserveProofResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, proofBody)
    ).data;
    setAccountState({ ...accountState, reserveProof: proof.result.signature });
  };

  const checkReserveProof = async (): Promise<void> => {
    const proofBody: Interfaces.CheckReserveProofRequest = Constants.CHECK_RESERVE_PROOF_REQUEST;
    proofBody.params.address = accountState.sendTo;
    proofBody.params.message = accountState.message;
    proofBody.params.signature = accountState.reserveProof;
    const proof: Interfaces.CheckReserveProofResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, proofBody)
    ).data;
    if (proof.result.good) {
      setAccountState({ ...accountState, proofValidation: proof.result });
      setShowProofValidation(true);
    }
  };

  const transfer = async (): Promise<void> => {
    setIsSending(true);
    const vBody: Interfaces.ValidateAddressRequest = Constants.VALIDATE_ADDRESS_REQUEST;
    vBody.params.address = accountState.sendTo.trim();
    const isValidAmt = accountState.amount < parseFloat(BigDecimal
      .divide(gAccount.unlockedBalance.toString(), Constants.PICO.toString(), 6));
    const vAddress: Interfaces.ValidateAddressResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, vBody)).data;
    if (vAddress.result.valid && isValidAmt) {
      const tBody: Interfaces.TransferRequest = Constants.TRANSFER_REQUEST;
      const destination: Interfaces.Destination = {
        address: accountState.sendTo.trim(),
        amount: BigInt(accountState.amount * Constants.PICO).toString(),
      };
      tBody.params.destinations.push(destination);
      // serialize the destination with big int
      const tx: Interfaces.TransferResponse = await (
        await AxiosClients.RPC.post(Constants.JSON_RPC, tBody)
      ).data;
      setAccountState({ ...accountState, hash: tx.result.tx_hash });
      handleTransferSuccess();
      handleIsSending();
      loadXmrBalance();
    }
    if (!vAddress.result.valid) {
      handleInvalidAddress();
    }
    if (!isValidAmt) { handleInvalidAmount(); }
  };

  useEffect(() => {
    if (!loaded) { loadXmrBalance(); }
  });

  const pendingBalance = gAccount.walletBalance - gAccount.unlockedBalance;
  const unlockTime = gAccount.unlockTime * 2;

  return (
    <div className={classes.root}>
      { (!gInit.isSeedConfirmed && !gInit.isRestoringFromSeed)
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
                className={classes.modalButton}
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
                  required
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('label')}
                />
                <br />
                <Button
                  className={classes.modalButton}
                  disabled={accountState.label === ''}
                  onClick={() => { generateSubAddress(); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.AddCircle />
                </Button>
                {' '}
                <Button
                  className={classes.modalButton}
                  onClick={() => { setIsGeneratingSubAddress(false); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.CloseRounded />
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
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('sendTo')}
                />
                <TextField
                  label="amount"
                  type="number"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('amount')}
                />
                <br />
                <Button
                  className={classes.modalButton}
                  disabled={BigInt(accountState.amount * Constants.PICO) > gAccount.unlockedBalance
                    || accountState.amount <= 0}
                  onClick={() => { transfer(); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.SendRounded />
                </Button>
                {' '}
                <Button
                  className={classes.modalButton}
                  onClick={() => { handleTransfer(); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.CloseRounded />
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      {/* Reserve Proof modal */}
      { isGeneratingProof
        && (
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={isGeneratingProof}
            closeAfterTransition
          >
            <Fade in={isGeneratingProof}>
              <div className={clsx(classes.paper, 'altBg')}>
                <h2 id="transition-modal-title">
                  Reserve Proof
                </h2>
                <p id="transition-modal-description">
                  Enter amount and optional message to generate OR
                  enter address, signature and optional message to validate.
                </p>
                <div>
                  <CopyToClipboard text={accountState.reserveProof}>
                    <button type="button" onClick={handleCopy}>
                      <p className={classes.proof}>
                        {`${accountState.reserveProof.slice(0, 19)}...`}
                      </p>
                    </button>
                  </CopyToClipboard>
                </div>
                <TextField
                  label="message"
                  type="text"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('message')}
                />
                <TextField
                  label="amount"
                  type="number"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('amount')}
                />
                <TextField
                  label="address"
                  type="text"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('sendTo')}
                />
                <TextField
                  label="signature"
                  type="text"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleAccountChange('reserveProof')}
                />
                <br />
                <Button
                  className={classes.modalButton}
                  disabled={BigInt(accountState.amount * Constants.PICO) > gAccount.unlockedBalance
                    || accountState.amount <= 0}
                  onClick={() => { generateReserveProof(); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.AddCircle />
                </Button>
                {' '}
                <Button
                  className={classes.modalButton}
                  disabled={accountState.sendTo === '' || accountState.reserveProof === ''}
                  onClick={() => { checkReserveProof(); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.CheckCircleRounded />
                </Button>
                {' '}
                <Button
                  className={classes.modalButton}
                  onClick={() => { setIsGeneratingProof(false); }}
                  variant="outlined"
                  color="primary"
                >
                  <MuIcons.CloseRounded />
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      <LockScreenComponent refresh={() => loadXmrBalance()} />
      {isBusy
        && (
          <div className={classes.qr}>
            <img
              loading="lazy"
              src={Constants.IS_DEV ? busyDev : busyProd}
              alt="monero logo"
              width={100}
            />
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
      <div className={classes.unlockedBalance}>
        <MuIcons.LockOpen className={classes.icon} />
        <h1>
          {`${BigDecimal.divide((gAccount.walletBalance - pendingBalance).toString(),
            Constants.PICO.toString(), 3)} XMR`}
          {' '}
        </h1>
      </div>
      <div className={classes.pendingBalance}>
        {((unlockTime > 5 && unlockTime !== 0) && pendingBalance > 0)
          && <MuIcons.HourglassEmpty className={classes.icon} />}
        {((unlockTime <= 5 && unlockTime !== 0) && pendingBalance > 0)
          && <MuIcons.HourglassFull className={classes.icon} />}
        <h3>
          {(pendingBalance > 0 && unlockTime > 0)
            && ` ${BigDecimal.divide(pendingBalance.toString(),
              Constants.PICO.toString(), 3)} ~ ${unlockTime} min.`}
        </h3>
      </div>
      <div className={classes.buttonRow}>
        <Button
          className={classes.mainButton}
          disabled={gAccount.unlockedBalance === 0n}
          onClick={() => { handleTransfer(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <SendIcon className={classes.icon} />
        </Button>
        <Button
          className={classes.mainButton}
          onClick={() => { getSubAddress(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <CallReceivedIcon className={classes.icon} />
        </Button>
        <Button
          className={classes.mainButton}
          onClick={() => { setIsGeneratingProof(true); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <MuIcons.Check className={classes.icon} />
        </Button>
        <Button
          className={classes.mainButton}
          disabled={isBusy}
          onClick={() => { loadXmrBalance(); }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <MuIcons.RefreshRounded className={classes.icon} />
        </Button>
      </div>
      {/* food court! */}
      <Snackbar open={copy} autoHideDuration={2000} onClose={handleCopy}>
        <Alert onClose={handleCopy} severity="success">
          Data copied to clipboard
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
          {`Send success for hash: ${accountState.hash.slice(0, 9)}...`}
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
          {`${accountState.amount} is not valid`}
        </Alert>
      </Snackbar>
      <Snackbar
        open={proofGenerated}
        autoHideDuration={2000}
        onClose={handleProofGeneration}
      >
        <Alert
          onClose={handleProofGeneration}
          severity="info"
        >
          Generating reserve proof...
        </Alert>
      </Snackbar>
      <Snackbar
        open={showProofValidation}
        autoHideDuration={5000}
        onClose={() => { setShowProofValidation(false); }}
      >
        <Alert
          onClose={() => { setShowProofValidation(false); }}
          severity="info"
        >
          {`Valid proof on ${BigDecimal.divide(accountState.proofValidation.spent.toString(),
            Constants.PICO.toString(), 3)} spent and
            ${BigDecimal.divide(accountState.proofValidation.total.toString(),
            Constants.PICO.toString(), 3)} total`}
        </Alert>
      </Snackbar>
      <Snackbar open={isSending} autoHideDuration={10000} onClose={handleIsSending}>
        <Alert onClose={handleIsSending} severity="info">
          Transfer in progress...
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WalletComponent;
