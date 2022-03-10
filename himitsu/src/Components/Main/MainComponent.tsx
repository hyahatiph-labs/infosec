import React, { ReactElement, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
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
import * as Interfaces from '../../Config/interfaces';
import * as Constants from '../../Config/constants';
import * as AxiosClients from '../../Axios/Clients';
import * as Prokurilo from '../../prokurilo';

// TODO: Refactor all modals to separate components
// TODO: view only wallet creation
// TODO: network stats and monerod connection
// TODO: sync status indicator and i2p status indicator
// TODO: fee estimate
// TODO: webxmr integration

interface UnlockState {
  walletName: string;
  password: string;
}

let locked = false;
const MainComponent: React.FC = (): ReactElement => {
  const [gInit] = useGlobalState('init');
  const [isDrawerOpen, setDrawer] = useState(false);
  const [cookies, setCookie] = useCookies(['himitsu']);
  const [isScreenLocked, setScreenLocked] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [values, setValues] = React.useState<UnlockState>({ walletName: '', password: '' });
  const classes = useStyles();

  const setCookieInHeader = async (): Promise<void> => {
    if (cookies.himitsu) {
      AxiosClients.RPC.defaults.headers.himitsu = `${cookies.himitsu}`;
    }
  };

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
   * Lock screen will be dependent on cookies
   * The expiration is set by prokurilo so even if
   * an attacker wanted to reset the expire time it wouldn't
   * work. User must set a strong password. This is what drives
   * prokurilo generating a new challenge. During screen lock
   * the wallet is closed temporarily. If chooses not to unlock
   * the screen the session will stop syncing until the next unlock.
   */
  const lockScreen = async (): Promise<void> => {
    if (cookies.himitsu) { // wait until first cookie is set
      setScreenLocked(false);
      // trigger get version, set wallet name
      if (!Constants.IS_DEV) {
        const vBody: Interfaces.RequestContext = Constants.GET_VERSION_REQUEST;
        await AxiosClients.RPC.post(Constants.JSON_RPC, vBody)
          .catch((e) => {
            setValues({ ...values, walletName: e.response.data.himitsuName });
            setScreenLocked(true);
          });
        await setCookieInHeader();
      }
      locked = true;
    }
  };

  const unlockScreen = async (): Promise<void> => {
    // use the password from user input to open the wallet
    const oBody: Interfaces.CreateWalletRequest = Constants.CREATE_WALLET_REQUEST;
    oBody.method = 'open_wallet';
    const o = await AxiosClients.RPC.post(Constants.JSON_RPC, oBody);
    if (o.status === Constants.HTTP_OK) {
      // prokurilo needs the address because it is wiped from the state
      const aBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
      const a = await (await AxiosClients.RPC.post(Constants.JSON_RPC, aBody)).data;
      const expire = await Prokurilo.authenticate(a);
      const expires = new Date(expire);
      setCookie('himitsu', AxiosClients.RPC.defaults.headers.himitsu,
        { path: '/', expires, sameSite: 'lax' });
      if (cookies.himitsu) {
        setScreenLocked(false);
      }
    }
    if (Constants.IS_DEV) { setScreenLocked(false); }
    locked = true;
  };

  useEffect(() => {
    if (!locked) { lockScreen(); }
  });

  /*
    If you want to use an existing wallet in development
    then set REACT_APP_HIMITSU_DEV=DEV in .env.local
    This will override wallet initialization.
  */
  const isWalletInitialized = ((gInit.isWalletInitialized
    || parseInt(localStorage.getItem(Constants.HIMITSU_INIT)
    || `${Number.MAX_SAFE_INTEGER - Date.now()}`, 10))
      < Date.now() || Constants.IS_DEV);

  return (
    <div className="main">
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
        {(!gInit.isWalletInitialized && !locked) && !Constants.IS_DEV && <WalletInitComponent />}
        {isWalletInitialized && isViewingContacts && <ContactsComponent />}
        {isWalletInitialized && isViewingWallet && !isScreenLocked && <MoneroAccountComponent />}
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
                  className={clsx(classes.textField)}
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
