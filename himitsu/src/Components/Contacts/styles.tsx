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
  textField: {
    margin: theme.spacing(1),
    width: '25ch',
  },
  icon: {
    margin: theme.spacing(0.5),
    color: '#212D36',
  },
  send: {
    margin: theme.spacing(1),
    backgroundColor: '#FFF',
    color: '#212D36',
  },
  buttonRow: {
    display: 'flex',
    alignContent: 'center',
  },
  nofrens: {
    margin: theme.spacing(1),
    fontSize: '20px',
    textAlign: 'center',
    color: '#212D36',
  },
  addButton: {
    marginLeft: theme.spacing(10),
  },
}));
