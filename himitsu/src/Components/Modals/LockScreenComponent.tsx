import React, { ReactElement, useState } from 'react';
import { useCookies } from 'react-cookie';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { CheckRounded } from '@material-ui/icons';
import clsx from 'clsx';
import * as AxiosClients from '../../Axios/Clients';
import { setGlobalState, useGlobalState } from '../../state';
import { useStyles } from './styles';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import * as Prokurilo from '../../prokurilo';

interface Props {
  refresh: () => Promise<void>;
}

const LockScreenComponent: React.FC<Props> = (props): ReactElement => {
  const classes = useStyles();
  const [gLock] = useGlobalState('lock');
  const [cookies, setCookie] = useCookies(['himitsu']);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [unlockState, setUnlockState] = React
    .useState<Interfaces.UnlockState>({ walletName: gLock.walletName, password: '' });

  const setCookieInHeader = async (): Promise<void> => {
    if (cookies.himitsu) {
      AxiosClients.RPC.defaults.headers.himitsu = `${cookies.himitsu}`;
    }
  };

  const handleUnlockChange = (prop: keyof Interfaces.UnlockState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setUnlockState({ ...unlockState, [prop]: event.target.value });
  };

  const handleInvalidPassword = (): void => { setInvalidPassword(!invalidPassword); };

  const unlockScreen = async (): Promise<void> => {
    // use the password from user input to open the wallet
    const oBody: Interfaces.CreateWalletRequest = Constants.CREATE_WALLET_REQUEST;
    oBody.params.filename = gLock.walletName;
    oBody.params.password = unlockState.password;
    oBody.method = 'open_wallet';
    const o = await AxiosClients.RPC.post(Constants.JSON_RPC, oBody);
    if (o.status === Constants.HTTP_OK) {
      // prokurilo needs the address because it is wiped from the state
      const aBody: Interfaces.ShowAddressRequest = Constants.SHOW_ADDRESS_REQUEST;
      const a: Interfaces.ShowAddressResponse = await (
        await AxiosClients.RPC.post(Constants.JSON_RPC, aBody)
      ).data;
      if (a.result) {
        const expire = await Prokurilo.authenticate(a.result.address);
        const expires = new Date(expire);
        setCookie('himitsu', AxiosClients.RPC.defaults.headers.himitsu,
          { path: '/', expires, sameSite: 'lax' });
        setGlobalState('lock', { ...gLock, isScreenLocked: false, isProcessing: false });
        await setCookieInHeader();
        const { refresh } = props;
        refresh();
      }
    } else {
      handleInvalidPassword();
    }
    if (Constants.IS_DEV) {
      setGlobalState('lock', { ...gLock, isScreenLocked: false, isProcessing: false });
    }
  };

  return (
    <div>
      { gLock.isScreenLocked
        && (
          <MUI.Modal
            aria-labelledby="transition-modal-title"
            aria-describedby="transition-modal-description"
            className={classes.modal}
            open={gLock.isScreenLocked}
            closeAfterTransition
          >
            <MUI.Fade in={gLock.isScreenLocked}>
              <div className={clsx(classes.paper, 'altBg')}>
                <h2 id="transition-modal-title">
                  Enter password:
                </h2>
                <MUI.TextField
                  label="password"
                  type="password"
                  required
                  id="standard-start-adornment"
                  className={clsx(classes.textField)}
                  onChange={handleUnlockChange('password')}
                />
                <br />
                <MUI.Button
                  className={classes.send}
                  disabled={unlockState.password === ''}
                  onClick={() => { unlockScreen(); }}
                  variant="outlined"
                  color="primary"
                >
                  <CheckRounded />
                </MUI.Button>
              </div>
            </MUI.Fade>
          </MUI.Modal>
        )}
      <MUI.Snackbar open={invalidPassword} autoHideDuration={5000} onClose={handleInvalidPassword}>
        <Alert onClose={handleInvalidPassword} severity="error">
          Invalid apassword
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default LockScreenComponent;
