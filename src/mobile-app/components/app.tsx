import React, { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { ExperimentWrapper } from "./experiment-wrapper";
import { RunPicker } from "./run-picker";
import { useRuns, IRun } from "../hooks/use-runs";
import { Uploader } from "./uploader";

import css from "./app.module.scss";

export const AppComponent: React.FC = () => {
  const { runs, startNewRun, saveActiveRunData, resetRuns, activeRun, setActiveRun, saveUploadedRun } = useRuns();
  const [uploadRun, setUploadRun] = useState<IRun|undefined>();

  const exitExperiment = () => setActiveRun(null);
  const closeUploader = () => setUploadRun(undefined);

  const renderRunPicker = () => {
    if (runs.length > 0) {
      // LATER: add support for onRunEdit and onRunDelete
      return (
        <>
          <RunPicker
            runs={runs}
            onRunSelect={setActiveRun}
            onRunUpload={setUploadRun}
          />
          <button onClick={resetRuns} style={{ margin: 20 }}>Reset Local Data</button>
        </>
      );
    }
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
          {renderRunPicker()}
          {uploadRun ? <Uploader run={uploadRun} onClose={closeUploader} saveUploadedRun={saveUploadedRun} /> : undefined}
        </>
      }
    </div>
  );
};
