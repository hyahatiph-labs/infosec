import React, { ReactElement, useState } from 'react';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { UpdateRounded } from '@material-ui/icons';
import clsx from 'clsx';
import { useStyles } from './styles';
import * as Interfaces from '../../Config/interfaces';
import * as AxiosClients from '../../Axios/Clients';


/* 
   TODO:
        * clean up input formatting, fluid / fill screen
        * build relay server with xmrbc-rs
        * set default relay server i2p address
        * and advanced switch
        * set easy mode to tx blob only
*/

const RelayComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [invalidHost, setInvalidHost] = useState(false);
  const [isUpdatedHost, setUpdatedHost] = useState(false);
  const [values, setValues] = React.useState<Interfaces.RelayState>({
    host: '',
    serviceProvider: '',
    txBlob: '',
  });

  const handleChange = (prop: keyof Interfaces.RelayState) => (event:
    React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleInvalidHost = (): void => { setInvalidHost(!invalidHost); };

  const handleUpdateHostSuccess = (): void => { setUpdatedHost(!isUpdatedHost); };

  const relay = async (): Promise<void> => {
    const host = `http://${values.host}`;
    try {
      const result = await AxiosClients.RELAY.get(host);
      console.log(result.statusText);
    } catch {
      handleInvalidHost();
    }
  };

  return (
    <div className={clsx(classes.settings, 'container-fluid col')}>
      <MUI.TextField
        label="relay host.b32.i2p"
        id="standard-start-adornment"
        className={classes.paper}
        onChange={handleChange('host')}
        InputProps={

        {
          startAdornment: <MUI.InputAdornment position="start">http://</MUI.InputAdornment>,
        }

      }
      />
      <MUI.TextField
        label="service provider"
        id="standard-start-adornment"
        className={classes.paper}
        onChange={handleChange('serviceProvider')}
      />
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
        open={isUpdatedHost}
        autoHideDuration={2000}
        onClose={handleUpdateHostSuccess}
      >
        <Alert
          onClose={handleUpdateHostSuccess}
          severity="success"
        >
          {`${values.host} is now connected.`}
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar
        open={invalidHost}
        autoHideDuration={2000}
        onClose={handleInvalidHost}
      >
        <Alert
          onClose={handleInvalidHost}
          severity="error"
        >
          {`${values.host} is not valid`}
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default RelayComponent;
