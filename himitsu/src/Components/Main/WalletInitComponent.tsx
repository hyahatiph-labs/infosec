import React, { ReactElement, useState } from 'react';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import clsx from 'clsx';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { Visibility } from '@material-ui/icons';
import {
  Button, CircularProgress, Snackbar, Typography,
} from '@material-ui/core';
import axios from 'axios';
import crypto from 'crypto';
import { Alert } from '@material-ui/lab';
import { setGlobalState, useGlobalState } from '../../state';
import * as Interfaces from '../../Config/interfaces';
import * as Constants from '../../Config/constants';
import { AntSwitch, useStyles } from './styles';

/**
 * If the user wants to configure a remote node,
 * do it in here. Otherwise use the default. Initialize
 * a wallet for the user by accepting name and password.
 * Display seed phrase and verify user stores securely before
 * proceeding to the balance display.
 * @returns WalletInit
 */
const WalletInitComponent: React.FC = (): ReactElement => {
  let host: string;
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [gAccount] = useGlobalState('account');
  const [open] = useState(!gInit.isWalletInitialized);
  const [invalidRpcHost, setInvalidRpcHost] = useState(false);
  const [isUpdatedRpcHost, setUpdatedRpcHost] = useState(false);
  const [values, setValues] = React.useState<Interfaces.WalletInitState>({
    url: '',
    walletPassword: '',
    walletName: '',
    showPassword: false,
    isInitializing: false,
    isAdvanced: false,
    networkType: 'STAGENET',
    rpcUserName: null,
    rpcPassword: null,
    seed: '',
    mode: 'Normal',
    height: 0,
  });

  const handleChange = (prop: keyof Interfaces.WalletInitState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClickShowPassword = (): void => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleWalletMode = (): void => {
    setValues({
      ...values,
      isAdvanced: !values.isAdvanced,
      mode: !values.isAdvanced ? 'Advanced' : 'Normal',
    });
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  };

  const handleInvalidRpcHost = (): void => {
    setInvalidRpcHost(!invalidRpcHost);
  };
  const handleUpdateRpcHostSuccess = (): void => {
    setUpdatedRpcHost(!isUpdatedRpcHost);
  };

  // TODO: refactor createAndOpenWallet to three functions

  /**
   * Create wallet with user input. If not advanced then
   * provide defaults for everything except wallet password.
   * Easy configure will connect to wallet-rpc over i2p.
   */
  const createAndOpenWallet = async (): Promise<void> => {
    host = `http://${values.isAdvanced ? values.url : gInit.rpcHost}/json_rpc`;
    setValues({ ...values, isInitializing: true });
    const rBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
    try {
      const rpcResult = await axios.post(host, rBody);
      if (rpcResult.status === Constants.HTTP_OK) {
        const filename = crypto.randomBytes(32).toString('hex');
        const body: Interfaces.CreateWalletRequest = Constants.CREATE_WALLET_REQUEST;
        body.params.filename = filename;
        body.params.password = values.walletPassword;
        if (values.seed !== '') {
          const dbody: Interfaces.RestoreDeterministicRequest = {
            ...body,
            params: {
              ...body.params,
              seed: values.seed,
              restore_height: values.height,
            },
          };
          const dResult = (await axios.post(host, dbody)).data;
          if (dResult.status === Constants.HTTP_OK) {
            setGlobalState('init', {
              ...gInit,
              isWalletInitialized: true,
              isRestoringFromSeed: true,
              walletName: filename,
              // TODO: password management and security
              walletPassword: values.walletPassword,
              network: values.networkType,
            });
            setGlobalState('account', {
              ...gAccount,
              mnemonic: '',
            }); // TODO: snackbar with error handling
          }
        } else {
          await axios.post(host, body);
          const result = await axios.post(host, body);
          if (result.status === Constants.HTTP_OK) {
            const kBody: Interfaces.QueryKeyRequest = Constants.QUERY_KEY_REQUEST;
            const k: Interfaces.QueryKeyResponse = (await axios.post(host, kBody)).data;
            setGlobalState('init', {
              ...gInit,
              isWalletInitialized: true,
              isRestoringFromSeed: false,
              walletName: filename,
              // TODO: password management and security
              walletPassword: values.walletPassword,
              network: values.networkType,
            }); // TODO: snackbar with error handling
            setGlobalState('account', {
              ...gAccount,
              mnemonic: k.result.key,
            }); // TODO: snackbar with error handling
          }
        }
      }
    } catch {
      handleInvalidRpcHost();
    }
  };

  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        className={classes.modal}
        open={open}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <div className={classes.paper}>
            <h2 id="transition-modal-title">Wallet Initialization</h2>
            <p id="transition-modal-description">
              Welcome to the himitsu prototype wallet. If you have a remote node configure it below.
            </p>
            <p id="transition-modal-description">
              If not, leave blank, one will be configured for you. Also, set a strong password
              below.
            </p>
            <p id="transition-modal-description">
              Once the wallet is created your seed phrase will be presented.
            </p>
            <p id="transition-modal-description">
              Be sure to keep it somewhere safe, it is the only way to recover your funds!
            </p>
            <Typography>{values.mode}</Typography>
            <AntSwitch inputProps={{ 'aria-label': 'ant design' }} onClick={handleWalletMode} />
            <FormControl className={clsx(classes.margin, classes.textField)}>
              <InputLabel htmlFor="standard-adornment-password">wallet password</InputLabel>
              <Input
                id="standard-adornment-password"
                type={values.showPassword ? 'text' : 'password'}
                value={values.walletPassword}
                onChange={handleChange('walletPassword')}
                endAdornment={(
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                    >
                      {values.showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )}
              />
            </FormControl>
            <br />
            {values.isAdvanced && (
              <TextField
                label="seed (optional)"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('seed')}
              />
            )}
            {values.isAdvanced && (
              <TextField
                label="height (optional)"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('height')}
              />
            )}
            {values.isAdvanced && (
              <TextField
                label="monero-wallet-rpc (host:port)"
                id="standard-start-adornment"
                required
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('url')}
                InputProps={{
                  startAdornment: <InputAdornment position="start">http://</InputAdornment>,
                }}
              />
            )}
            <br />
            <Button
              className={classes.send}
              disabled={values.isInitializing}
              onClick={() => {
                createAndOpenWallet();
              }}
              variant="outlined"
              color="primary"
            >
              Initialize
            </Button>
            {values.isInitializing && <CircularProgress />}
          </div>
        </Fade>
      </Modal>
      <Snackbar
        open={isUpdatedRpcHost}
        autoHideDuration={2000}
        onClose={handleUpdateRpcHostSuccess}
      >
        <Alert onClose={handleUpdateRpcHostSuccess} severity="success">
          {`${values.url} is now connected.`}
        </Alert>
      </Snackbar>
      <Snackbar open={invalidRpcHost} autoHideDuration={2000} onClose={handleInvalidRpcHost}>
        <Alert onClose={handleInvalidRpcHost} severity="error">
          {`${values.url} is not valid`}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default WalletInitComponent;
