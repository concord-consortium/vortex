import { Experiments, useExperiments, IExperimentStorage, defaultStorage } from "./use-experiments";
import { testHook, testAsyncHook } from "../../shared/test/test-hook";
import { IExperimentSchema, EXPERIMENT_VERSION_1 } from "../../shared/experiment-types";
import semver from "semver";
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
      version: EXPERIMENT_VERSION_1,
      metadata: {
        uuid: "first",
        name: "First Experiment",
        initials: "FE",
      },
      schema: emptySchema
    },
    {
      version: EXPERIMENT_VERSION_1,
      metadata: {
        uuid: "second",
        name: "Second Experiment",
        initials: "SE",
      },
      schema: emptySchema
    },
  ];

  it("returns built in experiments when no experiments have been saved or are downloaded", () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("test fetch failure"));
    (window as any).fetch = fetchMock;

    const result = testHook(() => useExperiments(defaultStorage));
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toEqual({experiments: builtInExperiments, upgradeApp: false});
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
    expect(result).toEqual({experiments: savedExperiments, upgradeApp: false});
  });

  it("returns previously saved experiments and saves downloaded experiments", async () => {
    const downloadedExperiments: Experiments = [
      {
        version: EXPERIMENT_VERSION_1,
        metadata: {
          uuid: "third",
          name: "Third Experiment",
          initials: "TE",
        },
        schema: emptySchema
      },
      {
        version: EXPERIMENT_VERSION_1,
        metadata: {
          uuid: "fourth",
          name: "Fourth Experiment",
          initials: "FE",
        },
        schema: emptySchema
      },
    ];

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
    expect(result).toEqual({experiments: savedExperiments, upgradeApp: false});

    // but will have saved the downloaded experiments in the fetch handler
    expect(mockedStorageSave).toHaveBeenCalledWith(downloadedExperiments);

    // LATER: figure out how to test setUseExperimentsResult() inside useEffect
  });

  it("does not save downloaded data if the experiments have a higher version", async () => {
    const nextVersion = semver.inc(EXPERIMENT_VERSION_1, "patch") as any;
    const downloadedExperiments: Experiments = [
      {
        version: nextVersion,
        metadata: {
          uuid: "third",
          name: "Third Experiment",
          initials: "TE",
        },
        schema: emptySchema
      },
      {
        version: nextVersion,
        metadata: {
          uuid: "fourth",
          name: "Fourth Experiment",
          initials: "FE",
        },
        schema: emptySchema
      },
    ];

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

    // will have NOT saved the downloaded experiments in the fetch handler (all are > current version)
    expect(mockedStorageSave).not.toHaveBeenCalled();

    // LATER: figure out how to test setUseExperimentsResult() inside useEffect
  });
});
