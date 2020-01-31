import React from "react";
import { ExperimentPicker } from "./experiment-picker";
import { ExperimentWrapper } from "./experiment-wrapper";
import { RunPicker } from "./run-picker";
import { useRuns } from "../hooks/use-runs";

import css from "./app.module.scss";

export const AppComponent: React.FC = () => {
  const { runs, startNewRun, saveActiveRunData, resetRuns, activeRun, setActiveRun } = useRuns();

  const exitExperiment = () => {
    setActiveRun(null);
  };

  return (
    <div className={css.app}>
      {activeRun ?
        <ExperimentWrapper
          experiment={activeRun.experiment}
          experimentIdx={activeRun.experimentIdx}
          data={activeRun.data}
          onDataChange={saveActiveRunData}
          onBackBtnClick={exitExperiment}
        />
        :
        <>
          <ExperimentPicker setExperiment={startNewRun}/>
          {
            runs.length > 0 &&
            <>
              <RunPicker runs={runs} onRunSelect={setActiveRun}/>
              <button onClick={resetRuns} style={{ margin: 20 }}>Reset Local Data</button>
            </>
          }
        </>
      }
    </div>
  );
};
