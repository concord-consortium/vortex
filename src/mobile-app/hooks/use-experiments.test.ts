import { Experiments, useExperiments, IExperimentStorage, defaultStorage } from "./use-experiments";
import { testHook, testAsyncHook } from "../../shared/test/test-hook";
import { IExperimentSchema } from "../../shared/experiment-types";
const builtInExperiments = require("../../data/experiments.json") as Experiments;

describe("use-experiments hook", () => {

  const emptySchema: IExperimentSchema = {
    sections: [],
    dataSchema: {
      type: "object",
      properties: {}
    }
  };
  const savedExperiments: Experiments = [
    {
      uuid: "first",
      name: "First Experiment",
      initials: "FE",
      schema: emptySchema
    },
    {
      uuid: "second",
      name: "Second Experiment",
      initials: "SE",
      schema: emptySchema
    },
  ];

  const downloadedExperiments: Experiments = [
    {
      uuid: "third",
      name: "Third Experiment",
      initials: "TE",
      schema: emptySchema
    },
    {
      uuid: "fourth",
      name: "Fourth Experiment",
      initials: "FE",
      schema: emptySchema
    },
  ];

  it("returns built in experiments when no experiments have been saved or are downloaded", () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("test fetch failure"));
    (window as any).fetch = fetchMock;

    const result = testHook(() => useExperiments(defaultStorage));
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual(builtInExperiments);
  });

  it("returns previously saved experiments when no experiments are downloaded", () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("test fetch failure"));
    (window as any).fetch = fetchMock;

    const mockedStorage: IExperimentStorage = {
      load: () => savedExperiments,
      save: () => undefined,
    };

    const result = testHook(() => useExperiments(mockedStorage));
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual(savedExperiments);
  });

  it("returns previously saved experiments and saves downloaded experiments", async () => {
    const fetchMock = jest.fn(() => Promise.resolve({
      json: () => Promise.resolve(downloadedExperiments)
    }));
    (window as any).fetch = fetchMock;

    const mockedStorageSave = jest.fn();
    const mockedStorage: IExperimentStorage = {
      load: () => savedExperiments,
      save: mockedStorageSave
    };

    // need to use async test here otherwise the setExperiments call won't be done within
    // the act() call in the hook test and will show a warning
    const result = await testAsyncHook(() => useExperiments(mockedStorage));
    expect(fetchMock).toHaveBeenCalled();

    // it will return the saved experiments immediately
    expect(result).toEqual(savedExperiments);

    // but will have saved the downloaded experiments in the fetch handler
    expect(mockedStorageSave).toHaveBeenCalledWith(downloadedExperiments);
  });
});
