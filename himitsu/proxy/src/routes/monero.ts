const express = require("express");
const router = express.Router();
import { CONFIG, HIMITSU_ENV } from '../config';
const xmrjs = require('monero-javascript');
const os = require('os');
const c = require('crypto');

const isMainnet: boolean = process.env.HIMITSU_PROXY_ENV === HIMITSU_ENV.MAINNET;
const HOST = isMainnet ? CONFIG.MAINNET_HOST : CONFIG.STAGENET_HOST;
const PORT = isMainnet ? CONFIG.MAINNET_PORT : CONFIG.STAGENET_PORT;
const isDev = process.env.NODE_ENV === 'DEV';

// @route GET /proxy/monero/test
// @desc Tests monero rpc route
// @access Public
// @status Working
router.get("/test", (_:any, res:any) =>
  res.json({
    msg: "monero api proxy is up!",
  })
);

// @route POST /proxy/monero/balance
// @desc get_balance rpc call
// @access Public
// @status Working
router.post("/balance", async (req:any, res:any) => {
  let w = await xmrjs.connectToWalletRpc(`http://${HOST}:${PORT}`, "", "");
  if (isDev) {
    await w.openWallet("himitsu", "himitsu");
  } else {
    await w.openWallet(req.body.walletName, req.body.walletPassword);
  }
  
  let primaryAddress = await w.getPrimaryAddress();
  let b = await w.getBalance();
  res.json({ balance: Number(b), primaryAddress });
});

// @route POST /proxy/monero/wallet/create
// @desc create_wallet rpc call
// @access Public
// @status Working
router.post("/wallet/create", async (req:any, res:any) => {
  console.log(req.body);
  const name = c.randomBytes(32).toString('hex');
  await xmrjs.createWalletFull({
    path: `${os.homedir()}/Monero/wallets/${name}`,
    password: req.body.password,
    networkType: req.body.networkType,
    server: new xmrjs.MoneroRpcConnection(`http://${HOST}:${PORT}`, "", ""),
  });
 res.send({ name })
});

module.exports = router;