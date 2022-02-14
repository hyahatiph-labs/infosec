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
import crypto from 'crypto';
import { setGlobalState, useGlobalState } from '../../state';
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

interface State {
    url: string | null;
    walletPassword: string;
    walletName: string;
    showPassword: boolean;
    isInitializing: boolean;
    isAdvanced: boolean;
    rpcUserName: string | null;
    rpcPassword: string | null;
    seed: string;
    networkType: string;
    mode: string;
  }

/**
 * If the user wants to configure a remote node,
 * do it in here. Otherwise use the default. Initialize
 * a wallet for the user by accepting name and password.
 * Display seed phrase and verify user stores securely before
 * proceeding to the balance display.
 * @returns WalletInit
 */
const WalletInitComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [open] = React.useState(!gInit.isWalletInitialized);
  const [values, setValues] = React.useState<State>({
    url: null,
    walletPassword: '',
    walletName: crypto.randomBytes(32).toString('hex'),
    showPassword: false,
    isInitializing: false,
    isAdvanced: false,
    networkType: 'STAGENET',
    rpcUserName: null,
    rpcPassword: null,
    seed: '',
    mode: 'Normie',
  });

  const handleChange = (prop: keyof State) => (event:
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
      mode: !values.isAdvanced ? 'Advanced' : 'Normie',
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
   * TODO: webworker
   */
  const createAndOpenWallet = async (): Promise<void> => {
    // let isWalletCreated = false;
    const wallet = await xmrjs.createWalletFull({
      password: values.walletPassword,
      networkType: xmrjs.MoneroNetworkType.STAGENET,
      serverUri: 'http://localhost:38083',
      serverUsername: 'himitsu',
      serverPassword: 'himitsu',
    });
    // synchronize with progress notifications
    // set wallet name in memory
    setGlobalState('init', {
      isWalletInitialized: true,
      rpcUserName: values.rpcUserName || gInit.rpcUserName,
      rpcPassword: values.rpcPassword || gInit.rpcPassword,
      rpcHost: values.url || gInit.rpcHost,
      // TODO: wallet naming convention
      walletName: values.walletName,
      // TODO: password management and security
      walletPassword: values.walletPassword,
      seed: values.seed,
      network: values.networkType,
      wallet,
    });
    // TODO: pass seed to modal for confirmation
    const address = await wallet.getPrimaryAddress();
    console.log(`Created wallet: ${address.slice(0, 9)}`);
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
            {
              values.isAdvanced
              && (
              <TextField
                label="rpc username"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('rpcUserName')}
              />
              )
            }
            {
              values.isAdvanced
              && (
              <TextField
                label="rpc password"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('rpcPassword')}
              />
              )
            }
            <br />
            {
              values.isAdvanced
              && (
              <TextField
                label="seed (optional)"
                id="standard-start-adornment"
                className={clsx(classes.margin, classes.textField)}
                onChange={handleChange('seed')}
              />
              )
            }
            {
              values.isAdvanced
              && (
              <TextField
                label="himitsu proxy url"
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
            {/* Add restore from seed functionality */}
            {values.isInitializing && <CircularProgress />}
          </div>
        </Fade>
      </Modal>
    </div>
  );
};

export default WalletInitComponent;
