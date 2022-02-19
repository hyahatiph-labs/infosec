import express from 'express';
import cors from 'cors';
import * as CONFIG from '../src/config';
import * as xmrjs from '../monero-javascript-0.6.4/index.js';
// build cors proxy for monero
const app = express();
app.use(express.json());
const corsOptions = {
    origin: "*",
    method: ["GET", "POST", "PATCH", "DELETE", "OPTIONS" ],
    optionsSuccessStatus: 200
  };
app.use(cors(corsOptions));
// API routes
const monero = require("./routes/monero");
// Set route paths
app.use("/proxy/monero", monero);
// Start server
app.listen(CONFIG.PORT, () =>
  console.log(`himitsu proxy server running on port ${CONFIG.PORT}`)
);

// will kill the proxy if monero-wallet-rpc connection is lost
setInterval(async () => {
  try {
    const rpc = await xmrjs.connectToWalletRpc(`http://${CONFIG.XMR_RPC_HOST}`,
      CONFIG.RPC_USER, CONFIG.RPC_AUTH)
      .catch(() => { throw new Error('Failed to connect to monero-wallet-rpc'); });
    const version = await rpc.getVersion();
    if (!version.state.isRelease) {
      throw new Error('Failed to connect to monero-wallet-rpc');
    }
  } catch {
    throw new Error('Failed to connect to monero-wallet-rpc');
  }
}, 60000)
