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
    marginLeft: theme.spacing(5),
  },
  icon: {
    margin: theme.spacing(0.5),
    backgroundColor: '#212D362',
    color: '#FF5277',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#212D362',
    color: '#FF5277',
  },
  info: {
    marginLeft: theme.spacing(3),
    color: '#FF5277',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
  },
}));
