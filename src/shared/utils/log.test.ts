import { logLevel, LogLevel, logError, logWarn, logInfo, logVerbose, logDebug, setLogLevel, setLoggers, ILoggers } from "./log";

describe("logging", () => {

  const errorMock = jest.fn();
  const warnMock = jest.fn();
  const infoMock = jest.fn();
  const verboseMock = jest.fn();
  const debugMock = jest.fn();

  let oldLoggers: ILoggers;

  beforeAll(() => {
    oldLoggers = setLoggers({
      [LogLevel.None]: null,
      [LogLevel.Error]: errorMock,
      [LogLevel.Warn]: warnMock,
      [LogLevel.Info]: infoMock,
      [LogLevel.Verbose]: verboseMock,
      [LogLevel.Debug]: debugMock,
    });
  });

  afterEach(() => {
    errorMock.mockClear();
    warnMock.mockClear();
    infoMock.mockClear();
    verboseMock.mockClear();
    debugMock.mockClear();
  });

  afterAll(() => {
    setLoggers(oldLoggers);
    setLogLevel(LogLevel.None);
  });

  const logToAll = () => {
    logError("foo");
    logWarn("bar");
    logInfo("baz");
    logVerbose("boom");
    logDebug("bing");
  };

  it("defaults to LogLevel.None for tests (set in setupTests.ts)", () => {
    expect(logLevel()).toEqual(LogLevel.None);
  });

  it("ignores all log calls when logging set to none", () => {
    logToAll();
    expect(errorMock).not.toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
    expect(verboseMock).not.toHaveBeenCalled();
    expect(debugMock).not.toHaveBeenCalled();
  });

  it("only logs errors when logging set to error", () => {
    setLogLevel(LogLevel.Error);
    logToAll();
    expect(errorMock).toHaveBeenCalled();
    expect(warnMock).not.toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
    expect(verboseMock).not.toHaveBeenCalled();
    expect(debugMock).not.toHaveBeenCalled();
  });

  it("only logs warns and errors when logging set to warn", () => {
    setLogLevel(LogLevel.Warn);
    logToAll();
    expect(errorMock).toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
    expect(infoMock).not.toHaveBeenCalled();
    expect(verboseMock).not.toHaveBeenCalled();
    expect(debugMock).not.toHaveBeenCalled();
  });

  it("only logs info, warns and errors when logging set to info", () => {
    setLogLevel(LogLevel.Info);
    logToAll();
    expect(errorMock).toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalled();
    expect(verboseMock).not.toHaveBeenCalled();
    expect(debugMock).not.toHaveBeenCalled();
  });

  it("only logs verbose, info, warns and errors when logging set to verbose", () => {
    setLogLevel(LogLevel.Verbose);
    logToAll();
    expect(errorMock).toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalled();
    expect(verboseMock).toHaveBeenCalled();
    expect(debugMock).not.toHaveBeenCalled();
  });

  it("logs all when logging set to debug", () => {
    setLogLevel(LogLevel.Debug);
    logToAll();
    expect(errorMock).toHaveBeenCalled();
    expect(warnMock).toHaveBeenCalled();
    expect(infoMock).toHaveBeenCalled();
    expect(verboseMock).toHaveBeenCalled();
    expect(debugMock).toHaveBeenCalled();
  });
});