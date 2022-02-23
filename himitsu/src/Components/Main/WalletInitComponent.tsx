import React, { ReactElement } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
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
  Button, CircularProgress, styled, Switch, Typography,
} from '@material-ui/core';
import axios from 'axios';
import crypto from 'crypto';
import { setGlobalState, useGlobalState } from '../../state';
import * as Interfaces from '../../Config/interfaces';
import * as Constants from '../../Config/constants';

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

const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#FF5722',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 26,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: '#212D36',
    boxSizing: 'border-box',
  },
}));

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
  const [open] = React.useState(!gInit.isWalletInitialized);
  const [values, setValues] = React.useState<Interfaces.WalletInitState>({
    url: null,
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
  });

  const handleChange = (prop: keyof Interfaces.WalletInitState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
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

  const handleMouseDownPassword = (event:
    React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  };

  /**
   * Create wallet with user input. If not advanced then
   * provide defaults for everything except wallet password.
   * Easy configure will connect to wallet-rpc over i2p.
   */
  const createAndOpenWallet = async (): Promise<void> => {
    host = `${values.url || gInit.rpcHost}/json_rpc`;
    setValues({ ...values, isInitializing: true });
    const filename = crypto.randomBytes(32).toString('hex');
    const body: Interfaces.CreateWalletRequest = Constants.CREATE_WALLET_REQUEST;
    body.method = 'create_wallet';
    body.params.filename = filename;
    body.params.password = values.walletPassword;
    if (values.seed) {
      const dbody: Interfaces.RestoreDeterministicRequest = {
        ...body, params: { ...body.params, seed: values.seed },
      };
      dbody.method = 'restore_deterministic_wallet';
      const result = (await axios.post(host, dbody)).data;
      if (result.status === Constants.HTTP_OK) {
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
      body.method = 'open_wallet';
      const result = await axios.post(host, body);
      if (result.status === Constants.HTTP_OK) {
        const kBody: Interfaces.QueryKeyRequest = Constants.QUERY_KEY_REQUEST;
        kBody.method = 'query_key';
        kBody.params.key_type = 'mnemonic';
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
              Welcome to the himitsu prototype wallet. If you have a remote
              node configure it below.
            </p>
            <p id="transition-modal-description">
              If not, leave blank, one will be configured for you.
              Also, set a strong password below.
            </p>
            <p id="transition-modal-description">
              Once the wallet is created your seed phrase will be presented.
            </p>
            <p id="transition-modal-description">
              Be sure to keep it somewhere safe, it is the only way to recover
              your funds!
            </p>
            <Typography>{values.mode}</Typography>
            <AntSwitch
              inputProps={{ 'aria-label': 'ant design' }}
              onClick={handleWalletMode}
            />
            <FormControl className={clsx(classes.margin, classes.textField)}>
              <InputLabel htmlFor="standard-adornment-password">
                wallet password
              </InputLabel>
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
            <TextField
              label="seed (optional)"
              id="standard-start-adornment"
              className={clsx(classes.margin, classes.textField)}
              onChange={handleChange('seed')}
            />
            {
              values.isAdvanced
              && (
              <TextField
                label="monero-wallet-rpc (host:port)"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                InputProps={

                  {
                    startAdornment: <InputAdornment position="start">http://</InputAdornment>,
                  }

                }
              />
              )
            }
            <br />
            <Button
              disabled={values.isInitializing}
              onClick={() => { createAndOpenWallet(); }}
              variant="outlined"
              color="primary"
            >
              Initialize
            </Button>
            {values.isInitializing && <CircularProgress />}
          </div>
        </Fade>
      </Modal>
    </div>
  );
};

export default WalletInitComponent;
