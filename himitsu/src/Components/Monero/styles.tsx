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
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(1),
  },
  icon: {
    margin: theme.spacing(0.5),
    color: '#212D36',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#FFF',
    color: '#212D36',
    borderRadius: '50',
  },
  pendingBalance: {
    color: '#212D36',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 0,
  },
  unlockedBalance: {
    marginTop: theme.spacing(30),
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
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'left',
    textAlign: 'left',
    fontFamily: 'comic',
    fontSize: '1em',
    color: '#212D36',
  },
  proof: {
    cursor: 'pointer',
    fontSize: '1em',
  },
}));
