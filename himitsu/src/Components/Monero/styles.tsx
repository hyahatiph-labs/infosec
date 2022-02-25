import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => createStyles({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    fontSize: '20px',
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    flexBasis: 'space-between',
    align: 'center',
  },
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
  qr: {
    cursor: 'pointer',
    backgroundColor: '255, 165, 0, 0.73',
    marginLeft: theme.spacing(5),
    marginBottom: theme.spacing(1),
    display: 'flex',
    alignContent: 'center',
  },
  icon: {
    margin: theme.spacing(0.5),
    color: '#212D36',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#FFF',
    color: '#212D36',
  },
  pendingBalance: {
    display: 'flex',
    alignItems: 'center',
    color: '#212D36',
  },
  unlockedBalance: {
    textShadow: '1px 1px #FFF',
    color: '#212D36',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(1),
    fontSize: '20px',
    textAlign: 'center',
  },
  info: {
    display: 'block',
    textAlign: 'left',
    fontFamily: 'comic',
    fontSize: '1em',
    color: '#212D36',
  },
}));
