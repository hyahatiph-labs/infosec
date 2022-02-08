import React, { ReactElement } from 'react';
import axios from 'axios';
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
import { Button, CircularProgress } from '@material-ui/core';
import { setGlobalState, useGlobalState } from '../../state';
import { HTTP_OK, PROXY } from '../../Config/constants';

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

interface State {
    url: string;
    password: string;
    showPassword: boolean;
    isInitializing: boolean;
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
    url: '',
    password: '',
    showPassword: false,
    isInitializing: false,
  });

  const handleChange = (prop: keyof State) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleClickShowPassword = (): void => {
    setValues({ ...values, showPassword: !values.showPassword });
  };

  const handleMouseDownPassword = (event:
    React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
  };

  // Create and open wallet
  const createWalletBody = {
    jsonrpc: '2.0',
    id: '0',
    method: 'create_wallet',
    params: { filename: gInit.walletName, password: values.password, language: 'English' },
  };
  const openWalletBody = {
    jsonrpc: '2.0',
    id: '0',
    method: 'open_wallet',
    params: { filename: gInit.walletName, password: values.password },
  };
  const createAndOpenWallet = async (): Promise<void> => {
    let isWalletCreated = false;
    setValues({ ...values, isInitializing: true });
    await axios
      .post(`${PROXY}/monero/wallet/create`, createWalletBody)
      .then((createRes) => {
        if (createRes.status === HTTP_OK) {
          isWalletCreated = true;
        }
      }).catch(() => { /* TODO: and snackbar for error handling */ });
    if (isWalletCreated) {
      await axios
        .post(`${PROXY}/monero/wallet/open`, openWalletBody)
        .then((openRes) => {
          if (openRes.status === HTTP_OK) {
            setGlobalState('init', {
              isWalletInitialized: true,
              remoteNodeUrl: gInit.remoteNodeUrl,
              walletName: gInit.walletName,
            });
          }
        }).catch(() => { /* TODO: and snackbar for error handling */ });
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
              Welcome to the himtisu prototype wallet. If you have a remote
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
            <TextField
              label="wallet rpc url"
              id="standard-start-adornment"
              className={clsx(classes.margin, classes.textField)}
              InputProps={

                  {
                    startAdornment: <InputAdornment position="start">http://</InputAdornment>,
                  }

                }
            />
            <FormControl className={clsx(classes.margin, classes.textField)}>
              <InputLabel htmlFor="standard-adornment-password">
                Password
              </InputLabel>
              <Input
                id="standard-adornment-password"
                type={values.showPassword ? 'text' : 'password'}
                value={values.password}
                onChange={handleChange('password')}
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
