export enum LogLevel {
  None = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Verbose = 4,
  Debug = 5
}

export interface ILoggers {
  // tslint:disable-next-line:ban-types
  [key: number]: null | Function;
}

let loggers: ILoggers = {
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
};

const getSavedLogLevel = () => {
  // Note that accessing window.localStorage in an iframe might cause following error:
  // Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
  // This depends on Chrome security settings:
  // Settings > Privacy > Content settings, "Block sites from setting any data"
  try {
    return parseInt(window.localStorage?.getItem("logLevel") || "", 10);
  } catch {
    return NaN;
  }
};

const savedLogLevel = getSavedLogLevel();
let _logLevel: LogLevel = !isNaN(savedLogLevel) ? savedLogLevel : LogLevel.Error;

export const logLevel = () => _logLevel;
export const setLogLevel = (newLogLevel: LogLevel) => _logLevel = newLogLevel;
export const setLoggers = (newLoggers: ILoggers) => {
  const oldLoggers = loggers;
  loggers = newLoggers;
  return oldLoggers;
};

export const log = (level: LogLevel, ...args: any) => {
  const logger = loggers[level];
  if ((level <= _logLevel) && logger) {
    logger.apply(null, args);
  }
};

export const logError = (...args: any) => log(LogLevel.Error, args);
export const logWarn = (...args: any) => log(LogLevel.Warn, args);
export const logInfo = (...args: any) => log(LogLevel.Info, args);
export const logVerbose = (...args: any) => log(LogLevel.Verbose, args);
export const logDebug = (...args: any) =>  log(LogLevel.Debug, args);
