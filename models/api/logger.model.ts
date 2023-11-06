export type Logger = Pick<typeof console, 'debug' | 'log' | 'info' | 'warn' | 'error'>;

export enum LogLevel {
  debug,
  log,
  info,
  warn,
  error
}
