import React, { useEffect } from "react";
import { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { ExperimentWrapper } from "./experiment-wrapper";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { LocalDataStorage } from "../../shared/utils/local-data-storage";
import { RunPicker } from "./run-picker";
import { IRun } from "./types";
import { useExperiments } from "../hooks/use-experiments";

import css from "./app.module.scss";

const runsStorage = new LocalDataStorage<IRun>("runs-");
const availableRunKeysStorage = new LocalDataStorage<string[]>("available-runs");

export const AppComponent: React.FC = () => {
  const { experiments, upgradeApp } = useExperiments();
  const [runKey, setRunKey] = useState<string | undefined>();
  const [availableRunKeys, setAvailableRuns] = useState<string[]>(availableRunKeysStorage.load() || []);

  useEffect(() => {
    availableRunKeysStorage.save(availableRunKeys);
  }, [availableRunKeys]);

  useEffect(() => {
    availableRunKeysStorage.save(availableRunKeys);
  }, [availableRunKeys]);

  const setupNewExperiment = (newExperiment: IExperiment) => {
    const newRunKey = Date.now().toString(); // easy version of UUID
    setRunKey(newRunKey);
    setAvailableRuns(availableRunKeys.concat(newRunKey));
    runsStorage.save({
      key: newRunKey,
      experiment: newExperiment,
      data: { timestamp: Date.now() }
    }, newRunKey);
  };

  const onDataChange = (newData: IExperimentData) => {
    if (runKey) {
      const run = runsStorage.load(runKey);
      if (run) {
        run.data = newData;
        runsStorage.save(run, runKey);
      }
    }
  };

  const onBackBtnClick = () => {
    setRunKey(undefined);
  };

  const resetLocalData = () => {
    setAvailableRuns([]);
  };

  let runData = null;
  let availableRuns: IRun[] = [];
  if (runKey) {
    runData = runsStorage.load(runKey);
  } else {
    availableRuns = availableRunKeys.map(key => runsStorage.load(key) as IRun).filter(run => run !== undefined);
  }

  return (
    <div className={css.app}>
      {runData ?
        <ExperimentWrapper
          experiment={runData.experiment}
          data={runData.data}
          onDataChange={onDataChange}
          onBackBtnClick={onBackBtnClick}
        />
        :
        <>
          <ExperimentPicker experiments={experiments} setExperiment={setupNewExperiment}/>
          {
            availableRuns.length > 0 &&
            <>
              <RunPicker runs={availableRuns} setRunKey={setRunKey}/>
              <button onClick={resetLocalData} style={{ margin: 20 }}>Reset Local Data</button>
            </>
          }
        </>
      }
      {upgradeApp ? <div>Please upgrade this app to the latest version</div> : undefined}
    </div>
  );
};
