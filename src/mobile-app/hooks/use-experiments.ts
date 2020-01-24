import { useState, useEffect } from "react";
import { runningTests } from "../../shared/test/running-tests";
import { IExperiment } from "../../shared/experiment-types";
const builtInExperiments = require("../../data/experiments.json") as Experiments;
const updateUrl = "https://models-resources.concord.org/vortex/data/experiments.json";
const localStorageKey = "experiments";

export type Experiments = IExperiment[];

export interface IExperimentStorage {
  load: () => Experiments | undefined;
  save: (experiments: Experiments) => void;
}

export class ExperimentStorage implements IExperimentStorage {

  public load() {
    let savedExperiments: Experiments | undefined;
    const stringifiedExperiments = window.localStorage.getItem(localStorageKey);
    if (stringifiedExperiments) {
      try {
        savedExperiments = JSON.parse(stringifiedExperiments);
      // tslint:disable-next-line:no-empty
      } catch (e) {}
    }
    return savedExperiments;
  }

  public save(experiments: Experiments) {
    window.localStorage.setItem(localStorageKey, JSON.stringify(experiments));
  }
}

export const defaultStorage = new ExperimentStorage();

export const useExperiments = (optionalStorage?: IExperimentStorage) => {

  // get the previously downloaded experiments (if any)
  const storage = optionalStorage || defaultStorage;
  const savedExperiments = storage.load();

  const [experiments, setExperiments] = useState<Experiments>(savedExperiments || builtInExperiments);

  // load the external json file each time time the consumer renders
  // (so the user does not have to quit and reload the app)
  useEffect(() => {
    fetch(updateUrl)
      .then(resp => resp.json())
      .then(remoteExperiments => {
        storage.save(remoteExperiments);
        setExperiments(remoteExperiments);
      })
      .catch(err => {
        if (!runningTests) {
          // tslint:disable:no-console
          console.error("Unable to load remote experiments:", err);
        }
      });
  }, /* no dependencies here so that is runs on each render of the consumer */);

  return experiments;
};
