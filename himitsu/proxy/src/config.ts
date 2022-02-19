import * as yargs from "yargs";

  /**
 * User input for the himitsu-proxy
 */
 const ARGS = yargs
 .option("port", {
   default: 5000,
   number: true,
   alias: "p",
   description: "Port to run this server on",
   demand: true,
 })
 .option("rpc-login", {
    string: true,
    alias: "rl",
    description: "Login monero-wallet-rpc (e.g. user:pass)",
    demand: true,
  })
  .option("wallet-path", {
    string: true,
    alias: "w",
    description: "relative directory in $HOME to your monero wallet files",
    demand: true,
  })
 .option("rpc-host", {
   string: true,
   alias: "rh",
   description: "Host and port of monero-wallet-rpc (e.g. localhost:38083)",
   demand: true,
 }).argv;

export const PORT: number = ARGS["port"];
export const XMR_RPC_HOST: string = ARGS["rpc-host"];
const creds: string[] = ARGS["rpc-login"].split(":");
export const RPC_USER = creds[0];
export const RPC_AUTH = creds[1];
export const WALLET_PATH: string = ARGS["wallet-path"];