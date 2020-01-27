export enum LogLevel {
  None = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Verbose = 4,
  Debug = 5
};

const loggers = {
  [LogLevel.None]: null,
  // tslint:disable-next-line:no-console
  [LogLevel.Error]: console.error,
  // tslint:disable-next-line:no-console
  [LogLevel.Warn]: console.warn,
  // tslint:disable-next-line:no-console
  [LogLevel.Info]: console.info,
  // tslint:disable-next-line:no-console
  [LogLevel.Verbose]: console.log,
  // tslint:disable-next-line:no-console
  [LogLevel.Debug]: console.debug,
}

let _logLevel: LogLevel = LogLevel.Error;

export const logLevel = () => _logLevel;
export const setLogLevel = (newLogLevel: LogLevel) => _logLevel = newLogLevel;

export const log = (level: LogLevel, ...args: any) => {
  const logger = loggers[level];
  if ((level <= _logLevel) && logger) {
    logger.apply(null, args);
  }
}

export const logError = (...args: any) => log(LogLevel.Error, args);
export const logWarn = (...args: any) => log(LogLevel.Warn, args);
export const logInfo = (...args: any) => log(LogLevel.Info, args);
export const logVerbose = (...args: any) => log(LogLevel.Verbose, args);
export const logDebug = (...args: any) =>  log(LogLevel.Debug, args);
