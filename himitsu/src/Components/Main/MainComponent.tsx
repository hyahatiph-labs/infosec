import React, { ReactElement, useEffect, useState } from 'react';
import crypto from 'crypto';
import clsx from 'clsx';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import SettingsIcon from '@material-ui/icons/Settings';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import ListItemText from '@material-ui/core/ListItemText';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import { CheckRounded, ContactMail } from '@material-ui/icons';
import {
  Button, Fade, Modal, Snackbar, TextField,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import logo from '../../Assets/logo.png';
import MoneroAccountComponent from '../Monero/MoneroAccountComponent';
import { useGlobalState } from '../../state';
import WalletInitComponent from './WalletInitComponent';
import { useStyles } from './styles';
import SettingsComponent from '../Settings/SettingsComponent';
import TransactionsComponent from '../Monero/TransactionsComponent';
import ContactsComponent from '../Contacts/ContactsComponent';
import * as Constants from '../../Config/constants';

// TODO: Refactor all modals to separate components
// TODO: webxmr integration

interface UnlockState {
  password: string;
}

let locked = false;
const MainComponent: React.FC = (): ReactElement => {
  const [gInit] = useGlobalState('init');
  const [isDrawerOpen, setDrawer] = useState(false);
  const [isScreenLocked, setScreenLocked] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [values, setValues] = React.useState<UnlockState>({ password: '' });
  const classes = useStyles();

  const handleChange = (prop: keyof UnlockState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  // panel injection drivers
  const [viewingWallet, setWalletView] = useState(true);
  const [viewingTxs, setTxView] = useState(false);
  const [viewingSettings, setSettingsView] = useState(false);
  const [viewingContacts, setContactsView] = useState(false);

  // Definition of panel injection
  const isViewingWallet = !isDrawerOpen && !viewingTxs && !viewingSettings && !viewingContacts;
  const isViewingTxs = !isDrawerOpen && !viewingWallet && !viewingSettings && !viewingContacts;
  const isViewingSettings = !isDrawerOpen && !viewingWallet && !viewingTxs && !viewingContacts;
  const isViewingContacts = !isDrawerOpen && !viewingWallet && !viewingTxs && !viewingSettings;

  // display drivers
  const handleMoveDrawer = (): void => { setDrawer(!isDrawerOpen); };
  const handleDisplayWallet = (): void => {
    setWalletView(true);
    setTxView(false);
    setSettingsView(false);
    setContactsView(false);
    setDrawer(false);
  };
  const handleDisplayTxs = (): void => {
    setWalletView(false);
    setTxView(true);
    setSettingsView(false);
    setContactsView(false);
    setDrawer(false);
  };
  const handleDisplaySettings = (): void => {
    setWalletView(false);
    setTxView(false);
    setSettingsView(true);
    setContactsView(false);
    setDrawer(false);
  };
  const handleDisplayContacts = (): void => {
    setWalletView(false);
    setTxView(false);
    setSettingsView(false);
    setContactsView(true);
    setDrawer(false);
  };

  /**
   * Defines the logic for the lock screen. The password is
   * put in local storage temporarily purely for convenience sake,
   * but should never be in there I think. After 360k seconds the
   * cleartext password is nuked from local storage upon attempting
   * to access the app. At this point the user must enter the password
   * matching the hash which remains in local storage.
   * TODO: better security on password management
   */
  const lockScreen = async (): Promise<void> => {
    const tLock = localStorage.getItem(Constants.TIME_HASH);
    if (tLock && Date.now() - parseInt(tLock, 10) > Constants.LOCK_LIMIT) {
      localStorage.setItem(Constants.UNLOCK_KEY, '');
      setScreenLocked(true);
    }
    locked = true;
  };

  const unlockScreen = async (): Promise<void> => {
    const localHash = localStorage.getItem(Constants.UNLOCK_HASH);
    const userHash = crypto.createHash('sha256');
    userHash.update(values.password);
    if (localHash === userHash.digest('hex')) {
      localStorage.setItem(Constants.TIME_HASH, Date.now().toString());
      localStorage.setItem(Constants.UNLOCK_KEY, values.password);
      setScreenLocked(false);
    } else {
      setInvalidPassword(true);
    }
  };

  useEffect(() => {
    if (!locked) { lockScreen(); }
  });

  /*
    If you want to use an existing wallet in development
    then set REACT_APP_HIMITSU_DEV=DEV in .env.local
    This will override wallet initialization.
  */
  const isDev = process.env.REACT_APP_HIMITSU_DEV === 'DEV';
  const isWalletConfigured = gInit.walletName !== '';
  const isWalletInitialized = ((gInit.isWalletInitialized || isWalletConfigured) || isDev);

  return (
    <div>
      <CssBaseline />
      <AppBar position="fixed" className={clsx(classes.appBar, 'altBg')}>
        <Toolbar>
          <button className={classes.menuButton} onClick={handleMoveDrawer} type="button">
            <img src={logo} alt="monero logo" width={50} />
          </button>
          <Typography variant="h6" noWrap>
            himitsu v0.1.0-experimental
          </Typography>
        </Toolbar>
      </AppBar>
      {isDrawerOpen
        && (
          <Drawer
            className={classes.drawer}
            variant="permanent"
            classes={{
              paper: classes.drawerPaper,
            }}
          >
            <Toolbar />
            <div className={classes.drawerContainer}>
              <List>
                <ListItem onClick={handleDisplayWallet} button key="Wallet">
                  <ListItemIcon>
                    <AccountBalanceWalletIcon className={classes.drawerIcon} />
                  </ListItemIcon>
                  <ListItemText primary="Wallet" />
                </ListItem>
                <ListItem onClick={handleDisplayContacts} button key="Contacts">
                  <ListItemIcon>
                    <ContactMail className={classes.drawerIcon} />
                  </ListItemIcon>
                  <ListItemText primary="Contacts" />
                </ListItem>
                <ListItem onClick={handleDisplayTxs} button key="Transactions">
                  <ListItemIcon>
                    <ImportExportIcon className={classes.drawerIcon} />
                  </ListItemIcon>
                  <ListItemText primary="Transactions" />
                </ListItem>
                <ListItem onClick={handleDisplaySettings} button key="Settings">
                  <ListItemIcon>
                    <SettingsIcon className={classes.drawerIcon} />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItem>
              </List>
            </div>
          </Drawer>
        )}
      <main className={classes.content}>
        <Toolbar />
        {(!gInit.isWalletInitialized && !isWalletConfigured) && !isDev && <WalletInitComponent />}
        {isWalletInitialized && isViewingContacts && <ContactsComponent />}
        {isWalletInitialized && isViewingWallet && <MoneroAccountComponent />}
        {isWalletInitialized && isViewingTxs && <TransactionsComponent />}
        {isWalletInitialized && isViewingSettings && <SettingsComponent />}
      </main>
      {/* Screen lock modal */}
      { isScreenLocked
        && (
          <Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={isScreenLocked}
            closeAfterTransition
          >
            <Fade in={isScreenLocked}>
              <div className={clsx(classes.paper, 'altBg')}>
                <h2 id="transition-modal-title">
                  Enter password:
                </h2>
                <TextField
                  label="password"
                  type="password"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.margin, classes.textField)}
                  onChange={handleChange('password')}
                />
                <br />
                <Button
                  className={classes.send}
                  disabled={values.password === ''}
                  onClick={() => { unlockScreen(); }}
                  variant="outlined"
                  color="primary"
                >
                  <CheckRounded />
                </Button>
              </div>
            </Fade>
          </Modal>
        )}
      <Snackbar
        open={invalidPassword}
        autoHideDuration={2000}
        onClose={() => { setInvalidPassword(false); }}
      >
        <Alert
          onClose={() => { setInvalidPassword(false); }}
          severity="error"
        >
          Invalid password.
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MainComponent;
