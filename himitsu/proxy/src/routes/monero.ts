const express = require("express");
const router = express.Router();
import * as CONFIG from '../config';
const xmrjs = require('monero-javascript');
const c = require('crypto');
import os from 'os';

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
  const w = await xmrjs.connectToWalletRpc(`http://${CONFIG.XMR_RPC_HOST}`, CONFIG.RPC_USER, CONFIG.RPC_AUTH);
  await w.openWallet(req.body.walletName, req.body.walletPassword);
  const primaryAddress = await w.getPrimaryAddress();
  const b = await w.getBalance();
  const n = await w.getNumBlocksToUnlock();
  const ub = await w.getUnlockedBalance();
  res.json({ balance: Number(b), unlockedBalance: Number(ub), primaryAddress, unlockBlocks: n[0] });
});

// @route POST /proxy/monero/wallet/create
// @desc create_wallet rpc call
// @access Public
// @status Working
router.post("/wallet/create", async (req:any, res:any) => {
  const name = c.randomBytes(32).toString('hex');
  const path = `${os.homedir()}/${CONFIG.WALLET_PATH}/${name}`;
  const password  = req.body.password;
  const networkType = req.body.networkType;
  const server = new xmrjs.MoneroRpcConnection(`http://${CONFIG.XMR_RPC_HOST}`,
    CONFIG.RPC_USER, CONFIG.RPC_AUTH);
  const mnemonic = req.body.seed || null;
  if (mnemonic) {
    await xmrjs.createWalletFull({ path, password, networkType, server, mnemonic });
  } else {
    await xmrjs.createWalletFull({ path, password, networkType, server });
  }
  const w = await xmrjs.connectToWalletRpc(`http://${CONFIG.XMR_RPC_HOST}`,
    CONFIG.RPC_USER, CONFIG.RPC_AUTH);
  await w.openWallet(name, password);
  const walletName = name;
  const seed = await w.getMnemonic();
 res.send({ walletName, seed })
});

module.exports = router;
