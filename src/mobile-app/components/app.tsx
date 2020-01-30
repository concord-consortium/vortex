import React from "react";
import { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { ExperimentWrapper } from "./experiment-wrapper";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { RunPicker } from "./run-picker";
import { useRuns, IRun } from "../hooks/use-runs";

import css from "./app.module.scss";

export const AppComponent: React.FC = () => {
  const { runs, addNewRun, saveRunData, resetRuns } = useRuns();
  const [ run, setRun ] = useState<IRun | null>(null);

  const startExperiment = (experiment: IExperiment) => {
    const newRun = addNewRun(experiment);
    setRun(newRun);
  };

  const exitExperiment = () => {
    setRun(null);
  };

  const handleDataChange = (data: IExperimentData) => {
    if (run) {
      saveRunData(run.key, data);
    }
  };

  return (
    <div className={css.app}>
      {run ?
        <ExperimentWrapper
          experiment={run.experiment}
          data={run.data}
          onDataChange={handleDataChange}
          onBackBtnClick={exitExperiment}
        />
        :
        <>
          <ExperimentPicker setExperiment={startExperiment}/>
          {
            runs.length > 0 &&
            <>
              <RunPicker runs={runs} onRunSelect={setRun}/>
              <button onClick={resetRuns} style={{ margin: 20 }}>Reset Local Data</button>
            </>
          }
        </>
      }
    </div>
  );
};
