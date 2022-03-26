import log, { LogLevel } from './logging';
import * as Utilities from './util';
import * as Configuration from './config';

/**
 * Entry point for analytics services.
 * Execute analytics database synchronization with
 * Monero blockchain if not already in progress.
 */
const run = async (): Promise<void> => {
        const isDaemonSynced = await Utilities.isDaemonSynced();
        log(
            isDaemonSynced ? "verified monero daemon sync" : "daemon not sync", LogLevel.INFO
        );
        if (isDaemonSynced) {
            clearInterval(daemonCheck);
            log("executing analytics daemon sync, this may take a while...", LogLevel.INFO)
            await Utilities.testDbConnection();
            await Utilities.extractBlocks();
        }
}
run();
const daemonCheck = setInterval(async () => {
    run();
}, Configuration.DAEMON_SYNC_CHECK_INTERVAL); // keep waiting for daemon to sync first
