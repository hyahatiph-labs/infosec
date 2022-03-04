import React, { ReactElement, useEffect, useState } from 'react';
import BigDecimal from 'js-big-decimal';
import * as MUI from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import {
  CheckCircleRounded, CloseRounded, ExpandMore,
} from '@material-ui/icons';
import clsx from 'clsx';
import axios from 'axios';
import CopyToClipboard from 'react-copy-to-clipboard';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import { setGlobalState, useGlobalState } from '../../state';
import { useStyles } from './styles';

let loaded = false;
const TransactionsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gInit] = useGlobalState('init');
  const [gTransfer] = useGlobalState('transfer');
  const [copy, setCopy] = useState(false);
  const [noTransfers, setNoTransfers] = useState(false);
  const [showProofValidation, setShowProofValidation] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [values, setValues] = React.useState<Interfaces.TransactionState>({
    address: '',
    txid: '',
    txProof: '',
    message: '',
    proofValidation: {
      confirmations: 0,
      good: false,
      in_pool: false,
      received: 0n,
    },
  });
  const host = `http://${gInit.rpcHost}/json_rpc`;

  const handleCopy = (): void => {
    setCopy(!copy);
  };

  const handleNoTransfers = (): void => {
    setNoTransfers(!noTransfers);
  };

  const handleChange = (prop: keyof Interfaces.TransactionState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setValues({ ...values, [prop]: event.target.value });
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
    const transfers: Interfaces.ShowTransfersResponse = await (
      await axios.post(host, tBody, Constants.I2P_PROXY)).data;
    const r = transfers.result;
    const hasTransfers = r.failed || r.in || r.out || r.pending || r.pool;
    if (hasTransfers) {
      let all: Interfaces.Transfer[] = [];
      if (r.failed) {
        all = all.concat(...all, r.failed);
      }
      if (r.in) {
        all = all.concat(...all, r.in);
      }
      if (r.pending) {
        all = all.concat(...all, r.pending);
      }
      if (r.pool) {
        all = all.concat(...all, r.pool);
      }
      if (r.out) {
        all = all.concat(...all, r.out);
      }
      const filter: Set<Interfaces.Transfer> = new Set(all);
      setGlobalState('transfer', { ...gTransfer, transferList: Array.from(filter) });
    } else {
      setGlobalState('transfer', { ...gTransfer, transferList: [] });
      handleNoTransfers();
    }
    if (!loaded) {
      loaded = true;
    }
  };

  const generateTxProof = async (txid: string, address: string): Promise<void> => {
    const proofBody: Interfaces.GetTxProofRequest = Constants.GET_TX_PROOF_REQUEST;
    proofBody.params.address = address;
    proofBody.params.txid = txid;
    const proof: Interfaces.GetTxProofResponse = await (
      await axios.post(host, proofBody, Constants.I2P_PROXY)).data;
    setValues({ ...values, txProof: proof.result.signature });
  };

  const checkTxProof = async (): Promise<void> => {
    const proofBody: Interfaces.CheckTxProofRequest = Constants.CHECK_TX_PROOF_REQUEST;
    proofBody.params.address = values.address;
    proofBody.params.message = values.message;
    proofBody.params.signature = values.txProof;
    proofBody.params.txid = values.txid;
    const proof: Interfaces.CheckTxProofResponse = await (
      await axios.post(host, proofBody, Constants.I2P_PROXY)).data;
    if (proof.result.good) {
      setValues({ ...values, proofValidation: proof.result });
      setShowProofValidation(true);
    }
  };

  useEffect(() => {
    if (!loaded) {
      loadTransactions(null);
    }
  });

  return (
    <div className="container-fluid">
      <div className={classes.buttonRow}>
        <MUI.ButtonGroup variant="outlined" aria-label="outlined button group">
          <MUI.Button onClick={() => loadTransactions('failed')}>Failed</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('in')}>In</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('pool')}>Pool</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('pending')}>Pending</MUI.Button>
          <MUI.Button onClick={() => loadTransactions('out')}>Out</MUI.Button>
        </MUI.ButtonGroup>
      </div>
      {gTransfer.transferList.length > 0 && (
        <div>
          {gTransfer.transferList.map((v) => (
            <MUI.Accordion className={clsx('altBg', classes.expanded)} key={`${v.txid}`}>
              <MUI.AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <MUI.Typography>
                  <b>{`${v.type.toUpperCase()} - `}</b>
                  <b>TXID: </b>
                  {` ${v.txid.slice(0, 18)}...`}
                </MUI.Typography>
              </MUI.AccordionSummary>
              <MUI.AccordionDetails className={classes.info}>
                <MUI.Typography>
                  <b>Date:</b>
                  {` ${new Date(v.timestamp * 1000).toISOString()}`}
                </MUI.Typography>
                <MUI.Typography>
                  <b>Address:</b>
                  {` ${v.address.slice(0, 9)}...`}
                </MUI.Typography>
                <MUI.Typography>
                  <b>Amt:</b>
                  {` ${BigDecimal.divide(v.amount.toString(),
                    Constants.PICO.toString(), 12)} XMR `}
                </MUI.Typography>
                <MUI.Typography>
                  <b>Fee:</b>
                  {` ${BigDecimal.divide(v.fee.toString(),
                    Constants.PICO.toString(), 12)} XMR `}
                </MUI.Typography>
                <MUI.Typography>
                  <b>Confirmations:</b>
                  {` ${v.confirmations ? v.confirmations : 0}`}
                </MUI.Typography>
                <MUI.Button onClick={() => {
                  generateTxProof(v.txid, v.address);
                  setIsGeneratingProof(true);
                }}
                >
                  <CheckCircleRounded />
                </MUI.Button>
                {/* Tx Proof modal */}
                {isGeneratingProof && (
                  <MUI.Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    className={classes.modal}
                    open={isGeneratingProof}
                    closeAfterTransition
                  >
                    <MUI.Fade in={isGeneratingProof}>
                      <div className={clsx(classes.paper, 'altBg')}>
                        <h2 id="transition-modal-title">Transaction Proof</h2>
                        <p id="transition-modal-description">
                          Enter txid, address and optional message to validate.
                        </p>
                        <div>
                          This tx:
                          <CopyToClipboard text={values.txProof}>
                            <button type="button" onClick={handleCopy}>
                              <div className={classes.proof}>
                                {` ${values.txProof.slice(0, 32)}...`}
                              </div>
                            </button>
                          </CopyToClipboard>
                        </div>
                        <MUI.TextField
                          label="message"
                          type="text"
                          required
                          id="standard-start-adornment"
                          className={clsx(classes.textField)}
                          onChange={handleChange('message')}
                        />
                        <MUI.TextField
                          label="txid"
                          type="text"
                          required
                          id="standard-start-adornment"
                          className={clsx(classes.textField)}
                          onChange={handleChange('txid')}
                        />
                        <MUI.TextField
                          label="address"
                          type="text"
                          required
                          id="standard-start-adornment"
                          className={clsx(classes.textField)}
                          onChange={handleChange('address')}
                        />
                        <MUI.TextField
                          label="signature"
                          type="text"
                          required
                          id="standard-start-adornment"
                          className={clsx(classes.textField)}
                          onChange={handleChange('txProof')}
                        />
                        <br />
                        {' '}
                        <MUI.Button
                          className={classes.modalButton}
                          disabled={values.address === '' || values.txProof === ''
                          || values.txid === ''}
                          onClick={() => {
                            checkTxProof();
                          }}
                          variant="outlined"
                          color="primary"
                        >
                          <CheckCircleRounded />
                        </MUI.Button>
                        {' '}
                        <MUI.Button
                          className={classes.modalButton}
                          onClick={() => {
                            setIsGeneratingProof(false);
                          }}
                          variant="outlined"
                          color="primary"
                        >
                          <CloseRounded />
                        </MUI.Button>
                      </div>
                    </MUI.Fade>
                  </MUI.Modal>
                )}
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
      <MUI.Snackbar open={copy} autoHideDuration={2000} onClose={handleCopy}>
        <Alert onClose={handleCopy} severity="success">
          Data copied to clipboard
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar
        open={showProofValidation}
        autoHideDuration={5000}
        onClose={() => {
          setShowProofValidation(false);
        }}
      >
        <Alert
          onClose={() => {
            setShowProofValidation(false);
          }}
          severity="info"
        >
          {`Valid proof is ${values.proofValidation.in_pool ? 'in pool' : 'not in pool'} 
            with ${values.proofValidation.confirmations} confirmation(s)`}
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default TransactionsComponent;
