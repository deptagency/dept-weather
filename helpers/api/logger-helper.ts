/* eslint-disable no-console */
import { LOG_TIMESTAMP_FORMAT, MIN_LOG_LEVEL_DEV, MIN_LOG_LEVEL_PROD } from 'constants/server';
import dayjs from 'dayjs';
import { NumberHelper } from 'helpers/number-helper';
import { Logger, LogLevel } from 'models/api/logger.model';

const MIN_LOG_LEVEL = process.env.NODE_ENV !== 'production' ? MIN_LOG_LEVEL_DEV : MIN_LOG_LEVEL_PROD;

export class LoggerHelper {
  static getLogger(label: string): Logger {
    const getPrefix = () => `${dayjs().format(LOG_TIMESTAMP_FORMAT)} ${label} -`;
    return {
      debug: (...data: any[]) => (MIN_LOG_LEVEL <= LogLevel.debug ? console.debug(getPrefix(), ...data) : undefined),
      log: (...data: any[]) => (MIN_LOG_LEVEL <= LogLevel.log ? console.log(getPrefix(), ...data) : undefined),
      info: (...data: any[]) => (MIN_LOG_LEVEL <= LogLevel.info ? console.info(getPrefix(), ...data) : undefined),
      warn: (...data: any[]) => (MIN_LOG_LEVEL <= LogLevel.warn ? console.warn(getPrefix(), ...data) : undefined),
      error: (...data: any[]) => console.error(getPrefix(), ...data)
    };
  }

  static trackPerformance() {
    const perfStart = performance.now();
    return () => {
      const duration = performance.now() - perfStart;
      const formattedDuration =
        duration < 1000 ? `${NumberHelper.round(duration, 0)}ms` : `${NumberHelper.round(duration / 1_000, 3)}s`;
      return formattedDuration;
    };
  }
}
