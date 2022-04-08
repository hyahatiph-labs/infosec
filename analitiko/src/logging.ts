import { LOG_FILTERS } from "./config";
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Enum for the log level
 */
export enum LogLevel {
  INFO = "INFO",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  PERF = "PERF",
  POSTGRESQL = "POSTGRESQL"
}

/**
 * Something like a struct for setting time of
 * execution in the performance logs.
 */
export const PERF_TIME = {
  start: 0,
  end: 0
}

/**
 * In-house logger since Typescript
 * doesn't like console.log()
 * @param {string} message - message to write
 * @param {LogLevel} level - level types to filter by
 */
export default async function log(message: string, level: LogLevel): Promise<void> {
  LOG_FILTERS.forEach((filter: LogLevel) => {
    if (filter === level) {
      const DATE: string = new Date().toISOString();
      const LOG_STRING = `[${level}]\t${DATE} => ${message}`;
      const PERF_STRING = filter === LogLevel.PERF 
        ? `(executed in ${(PERF_TIME.end - PERF_TIME.start) / 1000} seconds)` : '';
      const CHILD_LOG: ChildProcessWithoutNullStreams = spawn("echo", [
        `${LOG_STRING} ${PERF_STRING}`,
      ]);
      CHILD_LOG.stdout.pipe(process.stdout);
    }
  });
}
