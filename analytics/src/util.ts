import * as c from './config';
import { Sequelize } from 'sequelize';
import log, { LogLevel } from './logging';
import * as xmrjs from 'monero-javascript';
import * as Models from './models';

// TODO: use migrations instead of sync

export let isExtractingBlocks = false;
// let txCount = 0;
let blockCount = 0;

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
        log('Unable to connect to the database:', LogLevel.ERROR);
        process.exit(c.EXIT_ERROR)
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
    let aHeight = 0;
    try {
        aHeight = await Models.Block.max('height');
    } catch {
        log(`no height found for analytics db`, LogLevel.ERROR);
    }
    const bHeight = await daemon.getHeight();
    const rHeight = c.NUM_BLOCKS_TO_EXTRACT === 0 ? bHeight : (bHeight + c.NUM_BLOCKS_TO_EXTRACT) - bHeight
    const msg = aHeight < bHeight
        ? `Analytics database (${aHeight}) is behind Monero LMDB (${bHeight}) by ${rHeight + aHeight} blocks`
        : `Analytics database is on height ${aHeight}`
    await log(msg, LogLevel.INFO);
    return aHeight === bHeight - 1;
}

/**
 * Pull blocks and synchronize the analytics db with Monero blockchain.
 * To speed up the analytics database we will remove the MoneroBlock.hex,
 * MoneroTx.fullHex and MoneroTx.rctSigPrunable
 */
export const extractBlocks = async (): Promise<void> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    )
    isExtractingBlocks = true;
    // get known tip
    const tip = await daemon.getHeight()
    const nToGet = c.NUM_BLOCKS_TO_EXTRACT === 0 ? tip : c.NUM_BLOCKS_TO_EXTRACT;
    let aHeight = 0;
    try {
        aHeight = await Models.Block.max('height');
    } catch {
        log(`no height found for analytics db`, LogLevel.ERROR);
    }
    for (let i = aHeight > 0 ? aHeight : tip - nToGet; i < tip; i++) {
        const block = await daemon.getBlockByHeight(i)
        blockCount += 1;
        log(`processed ${blockCount} block(s)`, LogLevel.INFO);
        const lBlock = { ...block.toJson(), hex: null } // trim full hex
        Models.Block.create({ ...lBlock })
        // if (block.getTxHashes().length > 0) {
        //     txCount += 1
        //     block.getTxHashes().forEach(async (hash: string) => {
        //         tx = await daemon.getTx(hash)
        //         const liteTx = { ...tx.toJson(), fullHex: null, rctSigPrunable: null }
        //         log(`processed ${blockCount + 1} blocks`, LogLevel.INFO);
        //     })
        // }
    }
    isExtractingBlocks = false;
}

/**
 * Validate the Monero daemon synchronized
 * @returns Promise<boolean> - true if Monero daemon is synchronized
 */
export const isDaemonSynced = async (): Promise<boolean> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    )
    log(`info: ${JSON.stringify(await daemon.getInfo())}`, LogLevel.DEBUG);
    return await (await daemon.getInfo()).isSynchronized;
}
