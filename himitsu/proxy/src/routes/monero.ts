const express = require("express");
const router = express.Router();
import { CONFIG, HIMITSU_ENV } from '../config';
const xmrjs = require('monero-javascript');

const isMainnet: boolean = process.env.HIMITSU_PROXY_ENV === HIMITSU_ENV.MAINNET;
const HOST = isMainnet ? CONFIG.MAINNET_HOST : CONFIG.STAGENET_HOST;
const PORT = isMainnet ? CONFIG.MAINNET_PORT : CONFIG.STAGENET_PORT;

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
  console.log(req.body);
    const walletRpc = await xmrjs.connectToWalletRpc(`http://${HOST}:${PORT}`, "", "");
    const balance = await walletRpc.getBalance();
    res.json({ balance: Number(balance) })
});

// @route POST /proxy/monero/wallet/create
// @desc create_wallet rpc call
// @access Public
// @status Working
router.post("/wallet/create", (req:any, res:any) => {
    console.log(req.body);

});

// @route POST /proxy/monero/wallet/open
// @desc open_wallet rpc call
// @access Public
// @status Working
router.post("/wallet/open", async (req:any, res:any) => {
    console.log(req.body);
    let walletRpc = await xmrjs.connectToWalletRpc("http://localhost:38083", "", "");
    await walletRpc.openWallet("himitsu", "himitsu");
});

module.exports = router;