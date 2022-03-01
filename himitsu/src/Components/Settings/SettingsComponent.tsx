import React, { ReactElement, useState } from 'react';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import { UpdateRounded } from '@material-ui/icons';
import crypto from 'crypto';
import { setGlobalState, useGlobalState } from '../../state';
import { useStyles } from './styles';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';

const SettingsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [invalidRpcHost, setInvalidRpcHost] = useState(false);
  const [invalidPin, setInvalidPin] = useState(false);
  const [updatedPin, setUpdatedPin] = useState(false);
  const [isUpdatedRpcHost, setUpdatedRpcHost] = useState(false);
  const [values, setValues] = React.useState<Interfaces.SettingsState>({
    oldPin: '',
    pin: 0,
    rpcHost: '',
  });

  const handleChange = (prop: keyof Interfaces.SettingsState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleUpdatedPin = (): void => { setUpdatedPin(!updatedPin); };

  const handleInvalidPin = (): void => { setInvalidPin(!invalidPin); };

  const handleInvalidRpcHost = (): void => { setInvalidRpcHost(!invalidRpcHost); };

  const handleUpdateRpcHostSuccess = (): void => { setUpdatedRpcHost(!isUpdatedRpcHost); };

  const updateRpcHost = async (): Promise<void> => {
    const rBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
    const host = `http://${values.rpcHost}/json_rpc`;
    try {
      const result = await axios.post(host, rBody, Constants.I2P_PROXY);
      if (result.status === Constants.HTTP_OK) {
        setGlobalState('init', { ...gInit, rpcHost: values.rpcHost });
        localStorage.setItem(Constants.HIMITSU_RPC_HOST, values.rpcHost);
        handleUpdateRpcHostSuccess();
      }
    } catch {
      handleInvalidRpcHost();
    }
  };

  const updatePin = async (): Promise<void> => {
    // check for set pin
    const pinRequired = gInit.pinHash !== null;
    const hUserPin = crypto.createHash('sha256');
    hUserPin.update(values.oldPin.toString());
    const validPin = pinRequired ? gInit.pinHash === hUserPin.digest('hex') : true;
    if (values.pin <= 99999 || values.pin > 999999 || !validPin) {
      handleInvalidPin();
      setValues({ ...values, pin: 0, oldPin: '' });
    } else {
      const hash = crypto.createHash('sha256');
      hash.update(values.pin.toString());
      const hPin = hash.digest('hex');
      localStorage.setItem(Constants.PIN_HASH, hPin);
      handleUpdatedPin();
      setValues({ ...values, pin: 0, oldPin: '' });
    }
  };

  return (
    <div className={classes.settings}>
      <MUI.TextField
        label={Constants.IS_DEV ? 'monero-wallet-rpc (host:port)' : 'host.b32.i2p'}
        id="standard-start-adornment"
        className={classes.paper}
        onChange={handleChange('rpcHost')}
        InputProps={

        {
          startAdornment: <MUI.InputAdornment position="start">http://</MUI.InputAdornment>,
        }

      }
      />
      <MUI.Button
        className={classes.uButton}
        onClick={() => {
          updateRpcHost();
        }}
        variant="outlined"
        color="primary"
      >
        <UpdateRounded />
      </MUI.Button>
      <MUI.TextField
        label="current pin (optional)"
        value={values.oldPin}
        id="standard-start-adornment"
        className={classes.paper}
        onChange={handleChange('oldPin')}
      />
      <MUI.TextField
        label="pin-to-send (6-digit pin)"
        value={values.pin}
        id="standard-start-adornment"
        className={classes.paper}
        onChange={handleChange('pin')}
      />
      <MUI.Button
        className={classes.uButton}
        onClick={() => {
          updatePin();
        }}
        variant="outlined"
        color="primary"
      >
        <UpdateRounded />
      </MUI.Button>
      <MUI.Snackbar
        open={isUpdatedRpcHost}
        autoHideDuration={2000}
        onClose={handleUpdateRpcHostSuccess}
      >
        <Alert
          onClose={handleUpdateRpcHostSuccess}
          severity="success"
        >
          {`${values.rpcHost} is now connected.`}
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar
        open={invalidRpcHost}
        autoHideDuration={2000}
        onClose={handleInvalidRpcHost}
      >
        <Alert
          onClose={handleInvalidRpcHost}
          severity="error"
        >
          {`${values.rpcHost} is not valid`}
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar
        open={updatedPin}
        autoHideDuration={2000}
        onClose={handleUpdatedPin}
      >
        <Alert
          onClose={handleUpdatedPin}
          severity="success"
        >
          Pin updated successfully
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar
        open={invalidPin}
        autoHideDuration={2000}
        onClose={handleInvalidPin}
      >
        <Alert
          onClose={handleInvalidPin}
          severity="error"
        >
          Invalid pin. Enter a 6-digit pin
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default SettingsComponent;
