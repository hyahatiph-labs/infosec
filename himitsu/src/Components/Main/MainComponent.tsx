import React, { ReactElement, useState } from 'react';
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
import { ContactMail } from '@material-ui/icons';
import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import logo from '../../Assets/logo.png';
import { useGlobalState } from '../../state';
import WalletInitComponent from './WalletInitComponent';
import { useStyles } from './styles';
import SettingsComponent from '../Settings/SettingsComponent';
import TransactionsComponent from '../Wallet/TransactionsComponent';
import ContactsComponent from '../Contacts/ContactsComponent';
import * as Constants from '../../Config/constants';
import WalletComponent from '../Wallet/WalletComponent';

const MainComponent: React.FC = (): ReactElement => {
  const [gInit] = useGlobalState('init');
  const [gLock] = useGlobalState('lock');
  const [isDrawerOpen, setDrawer] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const classes = useStyles();

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
          <button
            disabled={gLock.isProcessing}
            className={classes.menuButton}
            onClick={handleMoveDrawer}
            type="button"
          >
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
        {(!gInit.isWalletInitialized) && !Constants.IS_DEV && <WalletInitComponent />}
        {isWalletInitialized && isViewingContacts && <ContactsComponent />}
        {isWalletInitialized && isViewingWallet && <WalletComponent />}
        {isWalletInitialized && isViewingTxs && <TransactionsComponent />}
        {isWalletInitialized && isViewingSettings && <SettingsComponent />}
      </main>
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
