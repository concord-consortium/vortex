import { Experiments, useExperiments, IExperimentStorage, defaultStorage } from "./use-experiments";
import { renderHook } from "@testing-library/react-hooks";
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

  it("is disabled for now", () => {
    expect(true).toEqual(true);
  });

  /*

  TEMPORARILY DISABLED ALONG WITH EXPERIMENT DOWNLOADS

  it("returns built in experiments when no experiments have been saved or are downloaded", () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("test fetch failure"));
    (window as any).fetch = fetchMock;

    const { result } = renderHook(() => useExperiments(defaultStorage));
    expect(fetchMock).toHaveBeenCalled();
    expect(result.current).toEqual({experiments: builtInExperiments, upgradeApp: false});
  });

  it("returns previously saved experiments when no experiments are downloaded", () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("test fetch failure"));
    (window as any).fetch = fetchMock;

    const mockedStorage: IExperimentStorage = {
      load: () => savedExperiments,
      save: () => undefined,
    };

    const { result } = renderHook(() => useExperiments(mockedStorage));
    expect(fetchMock).toHaveBeenCalled();
    expect(result.current).toEqual({experiments: savedExperiments, upgradeApp: false});
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

    const { result, waitForValueToChange } = renderHook(() => useExperiments(mockedStorage));

    // it will return the saved experiments immediately
    expect(result.current).toEqual({experiments: savedExperiments, upgradeApp: false});

    await waitForValueToChange(() => result.current.experiments);

    expect(fetchMock).toHaveBeenCalled();

    expect(result.current).toEqual({experiments: downloadedExperiments, upgradeApp: false});

    // but will have saved the downloaded experiments in the fetch handler
    expect(mockedStorageSave).toHaveBeenCalledWith(downloadedExperiments);
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

    const { result, waitForNextUpdate } = renderHook(() => useExperiments(mockedStorage));

    await waitForNextUpdate();

    expect(fetchMock).toHaveBeenCalled();

    expect(result.current).toEqual({experiments: savedExperiments, upgradeApp: true});

    // will have NOT saved the downloaded experiments in the fetch handler (all are > current version)
    expect(mockedStorageSave).not.toHaveBeenCalled();
  });

  */
});
