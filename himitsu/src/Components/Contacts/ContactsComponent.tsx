import * as MUI from '@material-ui/core';
import { useCookies } from 'react-cookie';
import {
  AddCircle, CloseRounded, ContactMailRounded, DeleteForeverOutlined, ExpandMore,
} from '@material-ui/icons';
import SendIcon from '@material-ui/icons/Send';
import React, { ReactElement, useEffect, useState } from 'react';
import clsx from 'clsx';
import { Alert } from '@material-ui/lab';
import { useStyles } from './styles';
import { setGlobalState, useGlobalState } from '../../state';
import * as Constants from '../../Config/constants';
import * as Interfaces from '../../Config/interfaces';
import * as AxiosClients from '../../Axios/Clients';
import LockScreenComponent from '../Modals/LockScreenComponent';

let loaded = false;
const ContactsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gLock] = useGlobalState('lock');
  const [gAccount] = useGlobalState('account');
  const [gContact] = useGlobalState('contact');
  const [noContacts, setNoContacts] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [cookies] = useCookies(['himitsu']);
  const [invalidAddress, setIsInvalidAddress] = useState(false);
  const [deleteFailure, setDeleteFailure] = useState(false);
  const [transferFailure, setTransferFailure] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [unlockState, setUnlockState] = React
    .useState<Interfaces.UnlockState>({ walletName: '', password: '' });
  const [values, setValues] = React.useState<Interfaces.ContactState>({
    address: '',
    amount: 0,
    name: '',
  });

  const setCookieInHeader = async (): Promise<void> => {
    if (cookies.himitsu) {
      AxiosClients.RPC.defaults.headers.himitsu = `${cookies.himitsu}`;
    }
  };

  const handleNoContacts = (): void => {
    setNoContacts(!noContacts);
  };

  const handleIsAdding = (): void => {
    setIsAdding(!isAdding);
  };

  const handleIsSending = (): void => {
    setIsSending(!isSending);
  };

  const handleInvalidAddress = (): void => {
    setIsInvalidAddress(!invalidAddress);
  };

  const handleDeleteFailure = (): void => {
    setDeleteFailure(!deleteFailure);
  };

  const handleTransferFailure = (): void => {
    setTransferFailure(!transferFailure);
  };

  const handleTransferSuccess = (): void => {
    setTransferSuccess(!transferSuccess);
  };

  const loadContacts = async (): Promise<void> => {
    await setCookieInHeader();
    const bookBody: Interfaces.GetAddressBookRequest = Constants.GET_ADDRESS_BOOK_REQUEST;
    await AxiosClients.RPC.post(Constants.JSON_RPC, bookBody)
      .then((cResponse) => {
        const book: Interfaces.GetAddressBookResponse = cResponse.data;
        if (book.result.entries) {
          setGlobalState('contact', { ...gContact, contactList: book.result.entries });
        } else {
          setGlobalState('contact', { ...gContact, contactList: [] });
          handleNoContacts();
        }
        if (!loaded) { loaded = true; }
      })
      .catch((e: Interfaces.ReAuthState) => {
        setUnlockState({
          ...unlockState,
          walletName: e.response.data.himitsuName
            ? e.response.data.himitsuName : unlockState.walletName,
        });
        setGlobalState('lock', { ...gLock, isScreenLocked: true, isProcessing: true });
        loaded = true;
      });
  };

  const addContact = async (): Promise<void> => {
    const addBody: Interfaces.AddAddressBookRequest = Constants.ADD_ADDRESS_BOOK_REQUEST;
    addBody.params.address = values.address;
    addBody.params.description = values.name;
    const vBody: Interfaces.ValidateAddressRequest = Constants.VALIDATE_ADDRESS_REQUEST;
    vBody.params.address = values.address;
    const address: Interfaces.ValidateAddressResponse = await (
      await AxiosClients.RPC.post(Constants.JSON_RPC, vBody)).data;
    if (!address.result.valid) {
      handleInvalidAddress();
    } else {
      const contact: Interfaces.AddAddressBookResponse = await (
        await AxiosClients.RPC.post(Constants.JSON_RPC, addBody)
      ).data;
      loadContacts();
      setIsAdding(false);
      if (contact.result.index > 0) {
        setIsAdding(false);
      }
    }
  };

  const deleteContact = async (index: number): Promise<void> => {
    const deleteBody: Interfaces.DeleteAddressBookRequest = Constants.DELETE_ADDRESS_BOOK_REQUEST;
    deleteBody.params.index = index;
    const result = await AxiosClients.RPC.post(Constants.JSON_RPC, deleteBody);
    if (result.status === Constants.HTTP_OK) {
      loadContacts();
    } else {
      handleDeleteFailure();
    }
  };

  const transferToContact = async (recipient: string, amount: bigint): Promise<void> => {
    setIsSending(true);
    const tBody: Interfaces.TransferRequest = Constants.TRANSFER_REQUEST;
    const d: Interfaces.Destination = { address: recipient, amount: amount.toString() };
    // disable send and notify user it is in progress
    tBody.params.destinations.push(d);
    const transfer = await (await AxiosClients.RPC.post(Constants.JSON_RPC, tBody)).data;
    if (transfer.result.tx_hash) {
      const bBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
      const balance: Interfaces.ShowBalanceResponse = await (
        await AxiosClients.RPC.post(Constants.JSON_RPC, bBody)).data;
      setGlobalState('account', {
        ...gAccount,
        unlockedBalance: balance.result.unlocked_balance,
        walletBalance: balance.result.balance,
      });
      setIsSending(false);
      handleTransferSuccess();
    } else {
      setIsSending(false);
      handleTransferFailure();
    }
  };

  const handleChange = (prop: keyof Interfaces.ContactState) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  useEffect(() => {
    if (!loaded) {
      loadContacts();
    }
  });

  return (
    <div className={classes.root}>
      {(loaded && gContact.contactList.length === 0)
      && <p className={classes.nofrens}>Create contact</p>}
      <div className={classes.addButton}>
        <MUI.Button
          className={classes.send}
          onClick={() => {
            handleIsAdding();
          }}
          variant="outlined"
          color="primary"
          size="medium"
        >
          <ContactMailRounded className={classes.icon} />
        </MUI.Button>
      </div>
      {gContact.contactList.length > 0 && (
        <div>
          {gContact.contactList.map((v) => (
            <MUI.Accordion className="altBg" key={v.index}>
              <MUI.AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <MUI.Typography>{v.description}</MUI.Typography>
              </MUI.AccordionSummary>
              <MUI.AccordionDetails>
                <MUI.Typography className={classes.info}>
                  <b>Address:</b>
                  {` ${v.address.slice(0, 36)}...`}
                </MUI.Typography>
              </MUI.AccordionDetails>
              <MUI.TextField
                label="amount"
                type="number"
                required
                id="standard-start-adornment"
                className={clsx(classes.textField)}
                onChange={handleChange('amount')}
              />
              <div className={classes.buttonRow}>
                <MUI.Button
                  className={classes.send}
                  disabled={gAccount.unlockedBalance === 0n || isSending
                    || BigInt(values.amount * Constants.PICO) > gAccount.unlockedBalance}
                  onClick={() => {
                    transferToContact(v.address, BigInt(values.amount * Constants.PICO));
                  }}
                  variant="outlined"
                  color="primary"
                  size="medium"
                >
                  <SendIcon className={classes.icon} />
                </MUI.Button>
                <MUI.Button
                  className={classes.send}
                  onClick={() => { deleteContact(v.index); }}
                  variant="outlined"
                  color="primary"
                  size="medium"
                >
                  <DeleteForeverOutlined className={classes.icon} />
                </MUI.Button>
              </div>
            </MUI.Accordion>
          ))}
        </div>
      )}
      <LockScreenComponent refresh={() => loadContacts()} />
      {/* Create contact modal */}
      {isAdding && (
        <MUI.Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={clsx(classes.modal)}
          open={isAdding}
          closeAfterTransition
        >
          <MUI.Fade in={isAdding}>
            <div className={clsx(classes.paper, 'altBg')}>
              <h2 id="transition-modal-title">Create contact</h2>
              <p id="transition-modal-description">Enter name and address</p>
              <MUI.TextField
                label="address"
                required
                id="standard-start-adornment"
                className={clsx(classes.textField)}
                onChange={handleChange('address')}
              />
              <MUI.TextField
                label="name"
                required
                id="standard-start-adornment"
                className={clsx(classes.textField)}
                onChange={handleChange('name')}
              />
              <br />
              <MUI.Button
                className={classes.send}
                onClick={() => {
                  addContact();
                }}
                variant="outlined"
                color="primary"
              >
                <AddCircle />
              </MUI.Button>
              {' '}
              <MUI.Button
                className={classes.send}
                onClick={() => {
                  handleIsAdding();
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
      <MUI.Snackbar open={invalidAddress} autoHideDuration={5000} onClose={handleInvalidAddress}>
        <Alert onClose={handleInvalidAddress} severity="error">
          {`${values.address.slice(0, 9)} is not valid`}
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar open={deleteFailure} autoHideDuration={5000} onClose={handleDeleteFailure}>
        <Alert onClose={handleDeleteFailure} severity="error">
          Failed to delete contact.
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar open={transferFailure} autoHideDuration={5000} onClose={handleTransferFailure}>
        <Alert onClose={handleTransferFailure} severity="error">
          Failed to send to contact.
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar open={isSending} autoHideDuration={5000} onClose={handleIsSending}>
        <Alert onClose={handleIsSending} severity="info">
          Transfer in progress...
        </Alert>
      </MUI.Snackbar>
      <MUI.Snackbar open={transferSuccess} autoHideDuration={5000} onClose={handleTransferSuccess}>
        <Alert onClose={handleTransferSuccess} severity="success">
          Send Success!
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default ContactsComponent;
