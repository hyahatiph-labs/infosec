import { makeStyles, styled, Switch } from '@material-ui/core';

const drawerWidth = 240;
export const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    backgroundColor: '#FFF',
  },
  appBar: {
    backgroundColor: '#FF5722',
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: '#212D36',
  },
  drawerContainer: {
    backgroundColor: '#212D36',
    color: '#FF5722',
  },
  drawerIcon: {
    cursor: 'pointer',
    color: '#FFF',
  },
  content: {
    fontFamily: 'sagona',
    color: '#FF5722',
    backgroundColor: '#FFF',
  },
  menuButton: {
    cursor: 'pointer',
    backgroundColor: '#212D36',
  },
  modal: {
    overflow: 'scroll',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    fontSize: '16px',
    backgroundColor: '#FFF',
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
  },
  withoutLabel: {
  },
  textField: {
    width: '42ch',
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
