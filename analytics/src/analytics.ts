import log, { LogLevel } from './logging';
import * as Utilities from './util';

/**
 * Entry point for analytics services.
 * Execute analytics database synchronization with
 * Monero blockchain if not already in progress.
 */
const run = async (): Promise<void> => {
    const isDaemonRunning = await Utilities.isDaemonSynced();
    log(
        isDaemonRunning ? "verified monero daemon sync" : "daemon not running", LogLevel.INFO
    );
    if (isDaemonRunning) {
        log("executing analytics daemon sync, this may take a while...", LogLevel.INFO)
        await Utilities.testDbConnection();
        await Utilities.extractBlocks();
    }
}
run();
