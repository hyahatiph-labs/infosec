import express from 'express'
import cors from 'cors';
// build cors proxy for monero
const app = express();
app.use(express.json());
const corsOptions = {
    origin: "*",
    method: ["GET", "POST"],
    optionsSuccessStatus: 200
  };
app.use(cors(corsOptions));
// API routes
const monero = require("./routes/monero");
// Set route paths
app.use("/proxy/monero", monero);
// Server port
const port = process.env.PORT || 5000;
// Start server
app.listen(port, () =>
  console.log(`himitsu proxy server running on port ${port}`)
);