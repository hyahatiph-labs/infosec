import React, { ReactElement, useState } from 'react';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import axios from 'axios';
import { setGlobalState, useGlobalState } from '../../state';
import { useStyles } from './styles';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';

const SettingsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [invalidRpcHost, setInvalidRpcHost] = useState(false);
  const [isUpdatedRpcHost, setUpdatedRpcHost] = useState(false);
  const [values, setValues] = React.useState<Interfaces.SettingsState>({
    rpcHost: '',
  });

  const handleChange = (prop: keyof Interfaces.SettingsState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleInvalidRpcHost = (): void => { setInvalidRpcHost(!invalidRpcHost); };
  const handleUpdateRpcHostSuccess = (): void => { setUpdatedRpcHost(!isUpdatedRpcHost); };

  const updateRpcHost = async (): Promise<void> => {
    const rBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
    try {
      const result = await axios.post(`http://${values.rpcHost}/json_rpc`, rBody);
      if (result.status === Constants.HTTP_OK) {
        setGlobalState('init', { ...gInit, rpcHost: values.rpcHost });
      }
    } catch {
      handleInvalidRpcHost();
    }
  };

  return (
    <div>
      <MUI.TextField
        label="monero-wallet-rpc (host:port)"
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
        Update
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
    </div>
  );
};

export default SettingsComponent;
