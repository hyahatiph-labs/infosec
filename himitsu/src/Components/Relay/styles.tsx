import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => createStyles({
  paper: {
    fontSize: '1em',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
  },
  uButton: {
    backgroundColor: '#FFF',
    color: '#212D36',
  },
  settings: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing(10),
  },
}));
