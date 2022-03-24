import * as c from './config';
import { Sequelize } from 'sequelize';
import log, { LogLevel } from './logging';
import * as xmrjs from 'monero-javascript';
import * as Models from './models';
import * as Configuration from './config';

// TODO: use migrations instead of sync

let blockCount = 0;
let aHeight = 0;

/**
 * Utilize sequelize ORM to connect via connection string
 */
export const sequelize = new Sequelize(
    `postgres://${c.PG_USER}:${c.PG_CREDENTIAL}@${c.PG_HOST}:${c.PG_PORT}/${c.PG_DB_NAME}`
);

/**
 * Verify connectivity to Postgresql database, otherwise terminate
 */
export const testDbConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        await Models.initializeModels(sequelize);
        c.WIPE_DB ?  await sequelize.sync({ force: true }) : await sequelize.sync({});
        log('Connection has been established successfully.', LogLevel.INFO);
      } catch (error) {
        log(`Unable to connect to the database: ${error}`, LogLevel.ERROR);
        process.exit(c.EXIT_ERROR);
    }
}

/**
 * Compare blockchain and analytics db height
 * @returns Promise<boolean> - true if db is on same height as blockchain
 */
export const isAnalyticsDbSynced = async (): Promise<boolean> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    )
    aHeight = 0;
    try {
        aHeight = await Models.Block.max('height') || 0;
    } catch {
        log(`no height found for analytics db`, LogLevel.ERROR);
    }
    const bHeight = await daemon.getHeight();
    const rHeight = c.NUM_BLOCKS_TO_EXTRACT === 0 ? bHeight : (bHeight + c.NUM_BLOCKS_TO_EXTRACT) - bHeight;
    const behind = aHeight > 0 ? bHeight - aHeight : rHeight - aHeight;
    const msg = aHeight < bHeight
        ? `Analytics database (${aHeight}) is behind Monero LMDB (${bHeight}) by ${behind} block(s)`
        : `Analytics database is on height ${aHeight}`
    await log(msg, LogLevel.INFO);
    return bHeight - aHeight < 2;
}

/**
 * Pull blocks and synchronize the analytics db with Monero blockchain.
 * To speed up the analytics database we will remove the MoneroBlock.hex,
 * MoneroTx.fullHex and MoneroTx.rctSigPrunable
 */
export const extractBlocks = async (): Promise<void> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    );
    // get known tip
    const tip = await daemon.getHeight();
    const nToGet = c.NUM_BLOCKS_TO_EXTRACT === 0 ? tip : c.NUM_BLOCKS_TO_EXTRACT;
    if (! await isAnalyticsDbSynced()) { // don't extract if we have enough blocks
        for (let i = aHeight > 0 ? aHeight + 1 : tip - nToGet; i < tip; i++) {
            const block = await daemon.getBlockByHeight(i);
            blockCount += 1;
            log(`processed ${blockCount} block(s)`, LogLevel.INFO);
            const lBlock = { ...block.toJson(), hex: null } // trim full hex
            const minerTxOutputAmount = lBlock.minerTx.outputs[0].amount; // all we want from MinerTx
            Models.Block.create({ ...lBlock, minerTxOutputAmount });
            if (block.getTxHashes().length > 0) {
                block.getTxHashes().forEach(async (hash: string) => {
                    const tx = await daemon.getTx(hash);
                    // manually extracted, nested values
                    const jTx  = tx.toJson()
                    const numInputs = jTx.inputs.length;
                    const numOutputs = jTx.outputs.length;
                    const rctSigFee = jTx.rctSignatures.txnFee;
                    const rctSigType = jTx.rctSignatures.type;
                    const height = block.toJson().height;
                    const lTx = {  ...jTx, fullHex: null, rctSigPrunable: null }
                    Models.Tx.create({ ...lTx,  numInputs, numOutputs, rctSigFee, rctSigType, height })
                })
            }
        }
    }
    // recursively call block extraction on par with monero block time
    setTimeout(async () => {
        extractBlocks()
    },  Configuration.MONERO_ESTIMATED_BLOCK_TIME);
}

/**
 * Validate the Monero daemon synchronized
 * @returns Promise<boolean> - true if Monero daemon is synchronized
 */
export const isDaemonSynced = async (): Promise<boolean> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    );
    log(`info: ${JSON.stringify(await daemon.getInfo())}`, LogLevel.DEBUG);
    return await (await daemon.getInfo()).isSynchronized;
}
