import { makeStyles, styled, Switch } from '@material-ui/core';

const drawerWidth = 240;
export const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    backgroundColor: '#212D36',
  },
  appBar: {
    backgroundColor: '#FF5722',
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    marginBottom: theme.spacing(10),
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#212D36',
    marginBottom: theme.spacing(10),
  },
  drawerContainer: {
    overflow: 'auto',
    backgroundColor: '#212D36',
    color: '#FF5722',
    marginBottom: theme.spacing(10),
  },
  content: {
    fontFamily: 'sagona',
    flexGrow: 1,
    padding: theme.spacing(10),
    color: '#FF5722',
    backgroundColor: '#FFF',
  },
  menuButton: {
    marginRight: theme.spacing(1),
    backgroundColor: '#212D36',
  },
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
  margin: {
    margin: theme.spacing(1),
  },
  withoutLabel: {
    marginTop: theme.spacing(3),
  },
  textField: {
    width: '25ch',
  },
  send: {
    marginRight: theme.spacing(0.1),
    backgroundColor: '#212D362',
    color: '#FF5277',
  },
}));

export const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 42,
  height: 16,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 15,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(9px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 2,
    '&.Mui-checked': {
      transform: 'translateX(12px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#FF5722',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
    width: 26,
    height: 12,
    borderRadius: 6,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: '#212D36',
    boxSizing: 'border-box',
  },
}));
