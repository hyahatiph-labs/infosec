import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => createStyles({
  modal: {
    display: 'flex',
    wrap: 'wrap',
    overflow: 'scroll',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    fontSize: '20px',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing(10),
  },
  expanded: {
    '&$expanded': {
      margin: '0',
    },
  },
  textField: {
    margin: theme.spacing(1),
    width: '25ch',
  },
  qr: {
    cursor: 'pointer',
    backgroundColor: '255, 165, 0, 0.73',
    marginBottom: theme.spacing(10),
  },
  icon: {
    color: '#212D36',
  },
  mainButton: {
    backgroundColor: '#FFF',
    color: '#212D36',
    borderRadius: '50',
  },
  modalButton: {
    backgroundColor: '#FFF',
    color: '#212D36',
    borderRadius: '50',
    margin: theme.spacing(1),
  },
  pendingBalance: {
    color: '#212D36',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(5),
  },
  unlockedBalance: {
    textShadow: '1px 1px #FFF',
    color: '#212D36',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  buttonRow: {
    marginTop: theme.spacing(5),
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'comic',
    fontSize: '1em',
    color: '#212D36',
  },
  proof: {
    cursor: 'pointer',
    fontSize: '1em',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#212D362',
    color: '#FF5277',
    margin: theme.spacing(1),
  },
}));
