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
  },
  root: {
    marginTop: theme.spacing(10),
  },
  textField: {
    margin: theme.spacing(1),
    width: '25ch',
  },
  icon: {
    color: '#212D36',
  },
  send: {
    backgroundColor: '#FFF',
    color: '#212D36',
    margin: theme.spacing(1),
  },
  buttonRow: {
    display: 'flex',
    alignContent: 'center',
    padding: theme.spacing(1),
  },
  nofrens: {
    fontSize: '20px',
    textAlign: 'center',
    color: '#212D36',
  },
  addButton: {
    padding: theme.spacing(1),
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
  expanded: {
    '&$expanded': {
      margin: '0',
    },
  },
}));
