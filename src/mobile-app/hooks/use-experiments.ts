import * as semver from "semver";
import { useState, useEffect } from "react";
import { IExperiment, MAX_SUPPORTED_EXPERIMENT_VERSION, EXPERIMENT_VERSION_1, EXPERIMENT_VERSION_1_1 } from "../../shared/experiment-types";
import { logError, logInfo } from "../../shared/utils/log";
const builtInExperiments = require("../../data/experiments-v1.1.0.json") as Experiments;
const getUpdateUrl = () => {
  const url = window.localStorage.getItem("updateUrl");
  return url || "https://models-resources.concord.org/vortex/data/experiments-v1.1.0.json";
};
const localStorageKey = "experiments";

export type Experiments = IExperiment[];

export interface IUseExperimentsResult {
  experiments: Experiments;
  upgradeApp: boolean;
}

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

export const migrateAndFilterRemoteExperiments = (remoteExperiments: Experiments) => {
  let save = false;
  let upgradeRequired = false;
  const filteredExperiments: Experiments = [];

  remoteExperiments.forEach(experiment => {
    if (semver.lte(experiment.version, MAX_SUPPORTED_EXPERIMENT_VERSION)) {
      while (semver.neq(experiment.version, MAX_SUPPORTED_EXPERIMENT_VERSION)) {
        switch (experiment.version) {
          case EXPERIMENT_VERSION_1:
            // no-op for now, if new version is added a migration would be added here
            // migrating to the next version.  The loop would continue until the migration
            // reaches the max supported version of the app
            experiment.version = EXPERIMENT_VERSION_1_1;
            break;
          case EXPERIMENT_VERSION_1_1:
            // again a noop - version 1.1 introduces time series but does not change existing experiment types
            // and the default remote experiments filename was updated so that older clients do not
            // get the new json.

            // We just need to update the version to the last supported version to exit the loop
            // THIS SHOULD LINE SHOULD BE MOVED TO THE LAST VERSION WHEN A VERSION IS ADDED
            experiment.version = MAX_SUPPORTED_EXPERIMENT_VERSION;
            break;
        }
      }

      filteredExperiments.push(experiment);
      save = true;
    } else {
      upgradeRequired = true;
    }
  });

  return {
    save,
    upgradeRequired,
    filteredExperiments
  };
};

export const useExperiments = (optionalStorage?: IExperimentStorage) => {
  // get the previously downloaded experiments (if any)
  const storage = optionalStorage || defaultStorage;
  const savedExperiments = storage.load();

  const [useExperimentsResult, setUseExperimentsResult] = useState<IUseExperimentsResult>({
    experiments: savedExperiments || builtInExperiments,
    upgradeApp: false
  });

  useEffect(() => {
    const updateUrl = getUpdateUrl();
    logInfo(`Updating experiments from ${updateUrl}`);
    fetch(updateUrl)
      .then(resp => resp.json())
      .then(remoteExperiments => {
        const {save, upgradeRequired, filteredExperiments} = migrateAndFilterRemoteExperiments(remoteExperiments);
        if (save) {
          storage.save(filteredExperiments);
        }
        setUseExperimentsResult({
          experiments: save ? filteredExperiments : useExperimentsResult.experiments,
          upgradeApp: upgradeRequired
        });
      })
      .catch(err => {
        logError("Unable to load remote experiments:", err);
      });
  }, []); // load the external json file once

  return useExperimentsResult;
};
