import React, { ReactElement, useEffect, useState } from 'react';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { ExpandMore } from '@material-ui/icons';
import axios from 'axios';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import { setGlobalState, useGlobalState } from '../../state';
import { useStyles } from './styles';

let loaded = false;
const TransactionsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [gTransfer] = useGlobalState('transfer');
  const [noTransfers, setNoTransfers] = useState(false);
  const host = `http://${gInit.rpcHost}/json_rpc`;

  const handleNoTransfers = (): void => {
    setNoTransfers(!noTransfers);
  };

  const filterTransactions = (type: string): Interfaces.ShowTransfersRequest => {
    gTransfer.transferList = [];
    setGlobalState('transfer', { ...gTransfer, transferList: [] });
    let body: Interfaces.ShowTransfersRequest = Constants.SHOW_TRANSFERS_REQUEST;
    if (type === 'failed') {
      body = Constants.SHOW_TRANSFERS_FAILED_REQUEST;
      return body;
    }
    if (type === 'in') {
      body = Constants.SHOW_TRANSFERS_IN_REQUEST;
      return body;
    }
    if (type === 'pool') {
      body = Constants.SHOW_TRANSFERS_POOL_REQUEST;
      return body;
    }
    if (type === 'pending') {
      body = Constants.SHOW_TRANSFERS_PENDING_REQUEST;
      return body;
    }
    if (type === 'out') {
      body = Constants.SHOW_TRANSFERS_OUT_REQUEST;
      return body;
    }
    return body;
  };

  const loadTransactions = async (type: string | null): Promise<void> => {
    let tBody: Interfaces.ShowTransfersRequest = Constants.SHOW_TRANSFERS_REQUEST;
    if (type) {
      tBody = filterTransactions(type);
    }
    const transfers: Interfaces.ShowTransfersResponse = await (await axios.post(host, tBody)).data;
    const r = transfers.result;
    const hasTransfers = r.failed || r.in || r.out || r.pending || r.pool;
    if (hasTransfers) {
      let all: Interfaces.Transfer[] = [];
      if (r.failed) { all = all.concat(...all, r.failed); }
      if (r.in) { all = all.concat(...all, r.in); }
      if (r.pending) { all = all.concat(...all, r.pending); }
      if (r.pool) { all = all.concat(...all, r.pool); }
      if (r.out) { all = all.concat(...all, r.out); }
      setGlobalState('transfer', { ...gTransfer, transferList: all });
    } else {
      setGlobalState('transfer', { ...gTransfer, transferList: [] });
      handleNoTransfers();
    }
    if (!loaded) { loaded = true; }
  };

  useEffect(() => {
    if (!loaded) { loadTransactions(null); }
  });

  return (
    <div>
      <div className={classes.buttonRow}>
        <MUI.ButtonGroup variant="outlined" aria-label="outlined button group">
          <MUI.Button onClick={() => loadTransactions('failed')}>Failed</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('in')}>In</MUI.Button>
        </MUI.ButtonGroup>
      </div>
      <div className={classes.buttonRow}>
        <MUI.ButtonGroup variant="outlined" aria-label="outlined button group">
          <MUI.Button onClick={() => loadTransactions('pool')}>Pool</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('pending')}>Pending</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('out')}>Out</MUI.Button>
        </MUI.ButtonGroup>
      </div>
      {gTransfer.transferList.length > 0 && (
        <div>
          {gTransfer.transferList.map((v) => (
            <MUI.Accordion className="altBg" key={`${v.txid}`}>
              <MUI.AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <MUI.Typography>
                  <b>{`${v.type.toUpperCase()} - `}</b>
                  <b>TXID: </b>
                  <code>{` ${v.txid.slice(0, 18)}...`}</code>
                </MUI.Typography>
              </MUI.AccordionSummary>
              <MUI.AccordionDetails className={classes.info}>
                <MUI.Typography className={classes.info}>
                  <b>Date:</b>
                  <code>{` ${new Date(v.timestamp * 1000).toISOString()}`}</code>
                </MUI.Typography>
                <MUI.Typography className={classes.info}>
                  <b>Address:</b>
                  <code>{` ${v.address.slice(0, 36)}...`}</code>
                </MUI.Typography>
                <MUI.Typography className={classes.info}>
                  <b>Amt: </b>
                  <code>{` ${(v.amount / Constants.PICO).toFixed(12)} XMR (`}</code>
                </MUI.Typography>
                <MUI.Typography className={classes.info}>
                  <b>Fee:</b>
                  <code>{` ${(v.fee / Constants.PICO).toFixed(12)} XMR)`}</code>
                </MUI.Typography>
                <MUI.Typography className={classes.info}>
                  <b>Confirmations:</b>
                  <code>{` ${v.confirmations ? v.confirmations : 0}`}</code>
                </MUI.Typography>
              </MUI.AccordionDetails>
            </MUI.Accordion>
          ))}
        </div>
      )}
      <MUI.Snackbar open={noTransfers} autoHideDuration={3000} onClose={handleNoTransfers}>
        <Alert onClose={handleNoTransfers} severity="info">
          No transactions found
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default TransactionsComponent;
