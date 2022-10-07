import React, { ReactElement, useState } from 'react';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { UpdateRounded } from '@material-ui/icons';
import clsx from 'clsx';
import axios from 'axios';
import { useStyles } from './styles';
import * as Interfaces from '../../Config/interfaces';
import * as Constants from '../../Config/constants';

/* TODO:
        * set default relay server i2p address
        * and advanced switch
        * set easy mode to tx blob only
*/

const RelayComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [invalidHost, setInvalidHost] = useState(false);
  const [relayAttempted, setRelayAttempt] = useState(false);
  const [values, setValues] = React.useState<Interfaces.RelayState>({
    txBlob: '',
  });

  const handleChange = (prop: keyof Interfaces.RelayState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleInvalidHost = (): void => { setInvalidHost(!invalidHost); };
  const handleRelayAttempt = (): void => { setRelayAttempt(!relayAttempted); };

  const relay = async (): Promise<void> => {
    const headers = { proxy: Constants.I2P_PROXY };
    const host = 'xaqc5oui6ehdlmu756lqi4lbxy7kd7yaxxywf3xdqz2o5pckfjxq.b32.i2p';
    try {
      const result = await axios.get(
        `http://${host}/relay?tx=${values.txBlob}`,
        headers,
      );
      setRelayAttempt(result.status === 200);
    } catch {
      handleInvalidHost();
    }
  };

  return (
    <div className={clsx(classes.settings, 'container-fluid')}>
      <MUI.TextField
        label="tx blob"
        id="standard-start-adornment"
        required
        className={classes.paper}
        onChange={handleChange('txBlob')}
      />
      <MUI.Button
        className={classes.uButton}
        onClick={() => {
          relay();
        }}
        variant="outlined"
        color="primary"
      >
        <UpdateRounded />
      </MUI.Button>
      {/* Snacks! */}
      <MUI.Snackbar
        open={relayAttempted}
        autoHideDuration={2000}
        onClose={handleRelayAttempt}
      >
        <Alert
          onClose={handleRelayAttempt}
          severity="success"
        >
          attempted to relay
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default RelayComponent;
