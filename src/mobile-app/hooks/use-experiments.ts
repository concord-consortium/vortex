import semver from "semver";
import { useState, useEffect } from "react";
import { IExperiment, MAX_SUPPORTED_EXPERIMENT_VERSION } from "../../shared/experiment-types";
import { logError } from "../../shared/utils/log";
import { LocalDataStorage } from "../../shared/utils/local-data-storage";
const builtInExperiments = require("../../data/experiments.json") as Experiments;
const updateUrl = "https://models-resources.concord.org/vortex/data/experiments.json";

export type Experiments = IExperiment[];

export interface IUseExperimentsResult {
  experiments: Experiments;
  upgradeApp: boolean;
}

export const defaultStorage = new LocalDataStorage<Experiments>("experiments");

export const migrateAndFilterRemoteExperiments = (remoteExperiments: Experiments) => {
  let save = false;
  let upgradeRequired = false;
  const filteredExperiments: Experiments = [];

  remoteExperiments.forEach(experiment => {
    if (semver.lte(experiment.version, MAX_SUPPORTED_EXPERIMENT_VERSION)) {
      /*
      TODO: when/if the version number is ever increased use something like the following
            to migrate the data to the latest version supported by the app.

      while (semver.neq(experiment.version, MAX_SUPPORTED_EXPERIMENT_VERSION)) {
        switch (experiment.version) {
          case EXPERIMENT_VERSION_1:
            // no-op for now, if new version is added a migration would be added here
            // migrating to the next version.  The loop would continue until the migration
            // reaches the max supported version of the app
            break;
        }
      }
      */

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
  }
}

export const useExperiments = (optionalStorage?: LocalDataStorage<Experiments>) => {

  // get the previously downloaded experiments (if any)
  const storage = optionalStorage || defaultStorage;
  const savedExperiments = storage.load();

  const [useExperimentsResult, setUseExperimentsResult] = useState<IUseExperimentsResult>({
    experiments: savedExperiments || builtInExperiments,
    upgradeApp: false
  });

  useEffect(() => {
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
        })
      })
      .catch(err => {
        logError("Unable to load remote experiments:", err);
      });
  }, [] /* load the external json file once */ );

  return useExperimentsResult;
};
