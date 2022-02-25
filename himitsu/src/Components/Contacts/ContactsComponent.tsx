import * as MUI from '@material-ui/core';
import { ContactMailRounded, DeleteForeverOutlined, ExpandMore } from '@material-ui/icons';
import SendIcon from '@material-ui/icons/Send';
import React, { ReactElement, useEffect, useState } from 'react';
import clsx from 'clsx';
import axios from 'axios';
import { Alert } from '@material-ui/lab';
import { useStyles } from './styles';
import { setGlobalState, useGlobalState } from '../../state';
import * as Interfaces from '../../Config/interfaces';
import * as Constants from '../../Config/constants';

let loaded = false;
const ContactsComponent: React.FC = (): ReactElement => {
  const classes = useStyles();
  const [gAccount] = useGlobalState('account');
  const [gContact] = useGlobalState('contact');
  const [gInit] = useGlobalState('init');
  const [noContacts, setNoContacts] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [invalidAddress, setIsInvalidAddress] = useState(false);
  const [deleteFailure, setDeleteFailure] = useState(false);
  const [transferFailure, setTransferFailure] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [values, setValues] = React.useState<Interfaces.ContactState>({
    address: '',
    amount: 0,
    name: '',
  });

  const host = `${gInit.rpcHost}/json_rpc`;

  const handleNoContacts = (): void => {
    setNoContacts(!noContacts);
  };

  const handleIsAdding = (): void => {
    setIsAdding(!isAdding);
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
    const bookBody: Interfaces.GetAddressBookRequest = Constants.GET_ADDRESS_BOOK_REQUEST;
    const book: Interfaces.GetAddressBookResponse = await (await axios.post(host, bookBody)).data;
    if (book.result.entries) {
      setGlobalState('contact', { ...gContact, contactList: book.result.entries });
    } else {
      setGlobalState('contact', { ...gContact, contactList: [] });
      handleNoContacts();
    }
    if (!loaded) { loaded = true; }
  };

  const addContact = async (): Promise<void> => {
    const addBody: Interfaces.AddAddressBookRequest = Constants.ADD_ADDRESS_BOOK_REQUEST;
    addBody.params.address = values.address;
    addBody.params.description = values.name;
    const vBody: Interfaces.ValidateAddressRequest = Constants.VALIDATE_ADDRESS_REQUEST;
    vBody.params.address = values.address;
    const address: Interfaces.ValidateAddressResponse = await (await axios.post(host, vBody)).data;
    if (!address.result.valid || address.result.nettype === 'mainnet') { // TODO: enable mainnet
      handleInvalidAddress();
    } else {
      const contact: Interfaces.AddAddressBookResponse = await (
        await axios.post(host, addBody)
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
    const result = await axios.post(host, deleteBody);
    if (result.status === Constants.HTTP_OK) {
      loadContacts();
    } else {
      handleDeleteFailure();
    }
  };

  const transferToContact = async (recipient: string, amount: number): Promise<void> => {
    const tBody: Interfaces.TransferRequest = Constants.TRANSFER_REQUEST;
    const d: Interfaces.Destination = { address: recipient, amount };
    tBody.params.destinations.push(d);
    const transfer = await (await axios.post(host, tBody)).data;
    if (transfer.result.tx_hash) {
      const bBody: Interfaces.ShowBalanceRequest = Constants.SHOW_BALANCE_REQUEST;
      const balance: Interfaces.ShowBalanceResponse = await (await axios.post(host, bBody)).data;
      setGlobalState('account', {
        ...gAccount,
        unlockedBalance: balance.result.unlocked_balance,
        walletBalance: balance.result.balance,
      });
      handleTransferSuccess();
    } else {
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
    <div>
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
            <MUI.Accordion key={v.index}>
              <MUI.AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <MUI.Typography>{v.description}</MUI.Typography>
              </MUI.AccordionSummary>
              <MUI.AccordionDetails>
                <MUI.Typography>{`${v.address.slice(0, 9)}...`}</MUI.Typography>
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
                  disabled={gAccount.unlockedBalance === 0
                    || values.amount * Constants.PICO > gAccount.unlockedBalance}
                  onClick={() => { transferToContact(v.address, values.amount * Constants.PICO); }}
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
      {/* Transfer modal */}
      {isAdding && (
        <MUI.Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={classes.modal}
          open={isAdding}
          closeAfterTransition
        >
          <MUI.Fade in={isAdding}>
            <div className={classes.paper}>
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
                Add
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
                Cancel
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
      <MUI.Snackbar open={transferSuccess} autoHideDuration={5000} onClose={handleTransferSuccess}>
        <Alert onClose={handleTransferSuccess} severity="success">
          Send Success!
        </Alert>
      </MUI.Snackbar>
    </div>
  );
};

export default ContactsComponent;
