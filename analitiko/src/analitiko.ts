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
            isDaemonSynced ? "verified monero daemon sync" : "daemon not synced", LogLevel.INFO
        );
        if (isDaemonSynced) {
            clearInterval(daemonCheck);
            log("executing analytics daemon sync, this may take a while...", LogLevel.INFO)
            await Utilities.testDbConnection();
            try {
                await Utilities.extractBlocks();
            } catch {
                log(`unknown error while extracting blocks, restarting`, LogLevel.ERROR);
                run();
            }
        }
}
run();
const daemonCheck = setInterval(async () => {
    run();
}, Configuration.DAEMON_SYNC_CHECK_INTERVAL); // keep waiting for daemon to sync first
