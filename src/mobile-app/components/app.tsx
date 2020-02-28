import React, { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { ExperimentWrapper } from "./experiment-wrapper";
import { RunPicker } from "./run-picker";
import { useRuns, IRun } from "../hooks/use-runs";
import { Uploader } from "./uploader";
import { getURLParam } from "../../shared/utils/get-url-param";

import css from "./app.module.scss";

export const AppComponent: React.FC = () => {
  const { runs, startNewRun, saveActiveRunData, resetRuns, activeRun, setActiveRun, saveUploadedRun, deleteRun } = useRuns();
  const [uploadRun, setUploadRun] = useState<IRun|undefined>();

  const exitExperiment = () => setActiveRun(null);
  const closeUploader = () => setUploadRun(undefined);

  const allowReset = getURLParam("allowReset") || false;

  const handleDeleteRun = (run: IRun) => {
    if (confirm(`Delete ${run.experiment.metadata.name} #${run.experimentIdx}?`)) {
      deleteRun(run);
    }
  };

  const handleUpload = () => setUploadRun(activeRun || undefined);

  const renderRunPicker = () => {
    if (runs.length > 0) {
      // LATER: add support for onRunEdit
      return (
        <>
          <RunPicker
            runs={runs}
            onRunSelect={setActiveRun}
            onRunUpload={setUploadRun}
            onRunDelete={handleDeleteRun}
          />
          {allowReset ? <button onClick={resetRuns} style={{ margin: 20 }}>Reset Local Data</button> : undefined}
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
          onUpload={handleUpload}
        />
        :
        <>
          <ExperimentPicker setExperiment={startNewRun}/>
          {renderRunPicker()}
        </>
      }
      {uploadRun ? <Uploader run={uploadRun} onClose={closeUploader} saveUploadedRun={saveUploadedRun} /> : undefined}
    </div>
  );
};
