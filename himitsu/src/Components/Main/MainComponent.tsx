import React, { ReactElement, useState } from 'react';
import clsx from 'clsx';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import logo from '../../Assets/logo.png';
import stagenetLogo from '../../Assets/stagenet.png';
import { useGlobalState } from '../../state';
import { useStyles } from './styles';
import * as Interfaces from '../../Config/interfaces';
import RelayComponent from '../Relay/RelayComponent';

const MainComponent: React.FC = (): ReactElement => {
  const [gInit] = useGlobalState('init');
  const [gLock] = useGlobalState('lock');
  const [isDrawerOpen, setDrawer] = useState(false);
  const classes = useStyles();

  // display drivers
  const handleMoveDrawer = (): void => { setDrawer(!isDrawerOpen); };

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
            <img
              src={gInit.network === Interfaces.NetworkType.MAINNET
                ? logo : stagenetLogo}
              alt="monero logo"
              width={50}
            />
          </button>
          <Typography variant="h6" noWrap>
            himitsu v0.1.0-relay
          </Typography>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <Toolbar />
        <RelayComponent />
      </main>
    </div>
  );
};

export default MainComponent;
