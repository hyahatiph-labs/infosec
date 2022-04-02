import * as c from './config';
import { Sequelize } from 'sequelize';
import log, { LogLevel } from './logging';
import * as xmrjs from 'monero-javascript';
import * as Models from './models';

// TODO: use migrations instead of sync
// https://sequelize.org/master/manual/migrations.html

let blockCount = 0;
let aHeight = 0;
const isCalculatingFees = c.NUM_BLOCKS_TO_EXTRACT >= 100;
let isBlockContainerInitialized = false; 
const sizeContainer: number[] = [];

interface KeyImage {
    hex: string;
}

interface TxInput {
    amount: number;
    keyImage: KeyImage;
    ringOutputIndices: number[];
}

/**
 * Utilize sequelize ORM to connect via connection string
 */
export const sequelize = new Sequelize(
    `postgres://${c.PG_USER}:${c.PG_CREDENTIAL}@${c.PG_HOST}:${c.PG_PORT}/${c.PG_DB_NAME}`,
    { logging: msg => log(msg, LogLevel.POSTGRESQL) }
);

/**
 * Verify connectivity to Postgresql database, otherwise terminate
 */
export const testDbConnection = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        await Models.initializeModels(sequelize);
        c.WIPE_DB ?  await sequelize.sync({ force: true }) : await sequelize.sync({});
        log('postgresql connection has been established', LogLevel.INFO);
      } catch (error) {
        throw new Error(`${error}`);
    }
}

/**
 * Compare blockchain and analytics db height
 * @returns Promise<boolean> - true if db is on same height as blockchain
 */
export const isAnalyticsDbSynced = async (): Promise<boolean> => {
    const daemon = await xmrjs.connectToDaemonRpc(
        c.MONERO_DAEMON_RPC_HOST, c.MONERO_DAEMON_RPC_USER, c.MONERO_DAEMON_RPC_CREDENTIAL
    );
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
        ? `Analitiko PGDB (${aHeight}) is behind Monero LMDB (${bHeight}) by ${behind} block(s)`
        : `Analitiko PGDB is on height ${aHeight}`;
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
    // start size calculation for M 
    if ( isCalculatingFees && !isBlockContainerInitialized) { await initializeSizeContainer(tip - nToGet, daemon); }
    if (! await isAnalyticsDbSynced()) { // don't extract if we have enough blocks
        for (let i = aHeight > 0 ? aHeight + 1 : tip - nToGet; i < tip; i++) {
            const block = await daemon.getBlockByHeight(i);
            blockCount += 1;
            if (blockCount % 100 === 0) { log(`processed ${blockCount} blocks`, LogLevel.INFO); }
            const lBlock = { ...block.toJson(), hex: null } // trim full hex
            const minerTxOutputAmount = lBlock.minerTx.outputs[0].amount; // all we want from MinerTx
            Models.Block.create({ ...lBlock, minerTxOutputAmount });
            if (block.getTxHashes().length > 0) {
                block.getTxHashes().forEach(async (hash: string) => {
                    const tx = await daemon.getTx(hash);
                    const jTx  = tx.toJson()
                    /* ring output indices extraction */
                    const ringOutputIndices: number[] = [];
                    if (!jTx.isMinerTx) {
                        const inputs: TxInput[] = jTx.inputs;
                        inputs.forEach(input => { ringOutputIndices.push(...input.ringOutputIndices); });
                    }
                    /* ring output indices extraction */
                    // manually extracted, nested values
                    const numInputs = jTx.inputs.length;
                    const numOutputs = jTx.outputs.length;
                    const rctSigFee = jTx.rctSignatures.txnFee;
                    const rctSigType = jTx.rctSignatures.type;
                    const size = rctSigFee / await calculateFeePerKb(block.getReward());
                    const height = block.toJson().height;
                    const lTx = {  ...jTx, fullHex: null, rctSigPrunable: null, ringOutputIndices };
                    Models.Tx.create({ ...lTx,  numInputs, numOutputs, rctSigFee, size, rctSigType, height });
                })
            }
            updateSizeContainer(block.getSize());
        }
    }
    // recursively call block extraction on par with monero block time
    setTimeout(async () => {
        if (await isDaemonSynced()) { await extractBlocks(); }
    },  c.MONERO_ESTIMATED_BLOCK_TIME);
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

/**
 * Get the first 100 blocks for calculating M. This would be H_i - 100,
 * where H_i equals the block height to start extraction. After this is
 * initialized pop off the first size and a new one as blocks are extracted.
 * @param {number} initialHeight - start grabbing size data from here
 * @param {MoneroDaemonRpc} daemon - share to this function so we can init
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeSizeContainer = async (initialHeight: number, daemon: any): Promise<void> => {
    const start = initialHeight - 100;
    const finish = start < 0 ? 100 : initialHeight;
    for (let i = start < 0 ? 0 : start; i < finish; i++) {
        const block = await daemon.getBlockByHeight(i);
        sizeContainer.push(block.getSize());
    }
    isBlockContainerInitialized = true;
    if (isBlockContainerInitialized) {
        log(`initial block size container: ${sizeContainer}`, LogLevel.DEBUG);
    }
}

/**
 * Calculate median.
 * @param {number[]}  array - array to work on
 * @returns median
 */
 const median = async (array: number[]): Promise<number> => {
    array.sort();
    const half = Math.floor(array.length / 2);
    return array.length % 2 !== 0  ? array[half] : (array[half] + array[half - 1]) / 2;
}

/**
 * ```bash
 * Fee per kB = (R/R0) * (M0/M) * F0 * (60/300) * 4
 * ```
 * Reference: Mastering Monero, SerHack p. 141
 * @param {number} R - base reward from block
 */
const calculateFeePerKb = async (R: number): Promise<number> => 
    (R / c.R_0) * (c.M_0 / await median(sizeContainer)) * c.F_0 * c.AF_1 * c.AF_2;

/**
 * Keep updating the the last 100 block sizes to calculate median
 * @param {number} size - block size
 */
const updateSizeContainer = async (size: number): Promise<void> => {
    delete sizeContainer[0];
    sizeContainer.push(size);
}
