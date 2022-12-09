import winston from 'winston';
import type { Logger } from 'winston';
import {
  LOG_LABEL_STR_PADDING,
  LOG_LEVEL_STR_PADDING,
  LOG_TIMESTAMP_FORMAT,
  MIN_LOG_LEVEL_DEV,
  MIN_LOG_LEVEL_PROD
} from 'constants/server';
import { NumberHelper } from 'helpers';

export class LoggerHelper {
  private static readonly FORMAT_COLORIZE = winston.format.colorize({
    level: true
  });
  private static readonly FORMAT_TIMESTAMP = winston.format.timestamp({
    format: LOG_TIMESTAMP_FORMAT
  });
  private static readonly FORMAT_LEVEL = winston.format(info => {
    info.level = `${info.level[0].toUpperCase()}${info.level.slice(1)}`.padEnd(LOG_LEVEL_STR_PADDING);
    return info;
  })();

  private static loggers = new Map<string, Logger>();

  private static getFormatLabel(label: string) {
    return winston.format.label({
      label: `[${label}]`.padEnd(LOG_LABEL_STR_PADDING)
    });
  }

  static getLogger(label: string) {
    if (!this.loggers.has(label)) {
      this.loggers.set(
        label,
        winston.createLogger({
          level: MIN_LOG_LEVEL_DEV,
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                this.FORMAT_LEVEL,
                this.getFormatLabel(label),
                this.FORMAT_TIMESTAMP,
                this.FORMAT_COLORIZE,
                winston.format.printf(info => `${info.timestamp} ${info.level} ${info.label} ${info.message}`)
              ),
              level: process.env.NODE_ENV !== 'production' ? MIN_LOG_LEVEL_DEV : MIN_LOG_LEVEL_PROD
            })
          ]
        })
      );
    }
    return this.loggers.get(label)!;
  }

  static trackPerformance() {
    const perfStart = performance.now();
    return () => {
      const duration = performance.now() - perfStart;
      const formattedDuration =
        duration < 1000 ? `${NumberHelper.round(duration, 0)}ms` : `${NumberHelper.round(duration / 1_000, 2)}s`;
      return formattedDuration;
    };
  }
}
