import { IExperiment, IExperimentData, initNewFormData } from "../../shared/experiment-types";
import { useLocalStorage } from "./use-local-storage";
import { useState } from "react";

export interface IRun {
  key: string;
  experimentIdx: number;
  experiment: IExperiment;
  data: IExperimentData;
}

export interface IUseRunsResult {
  runs: IRun[];
  startNewRun: (experiment: IExperiment) => IRun;
  activeRun: IRun | null;
  setActiveRun: (run: IRun | null) => void;
  saveActiveRunData: (data: IExperimentData) => void;
  resetRuns: () => void;
  saveUploadedRun: (run: IRun) => void;
  deleteRun: (run: IRun) => void;
}

export const useRuns = (): IUseRunsResult => {
  const [runs, setRuns] = useLocalStorage<IRun[]>("runs", []);
  const [ activeRun, setActiveRun ] = useState<IRun | null>(null);

  // returns index of run or end of array index to append run
  const getRunIndex = (run: IRun) => {
    let index = 0;
    for (; index < runs.length; index++) {
      if (runs[index].key === run.key) {
        break;
      }
    }
    return index;
  };

  const updateRun = (oldRun: IRun, newRun: IRun) => {
    const index = getRunIndex(oldRun);
    const newRuns = runs.slice();
    newRuns[index] = newRun;
    setRuns(newRuns);
  };

  const startNewRun = (experiment: IExperiment) => {
    const timestamp = Date.now();
    let experimentIdx = 1;
    runs.forEach(run => {
      if (run.experiment.metadata.name === experiment.metadata.name) {
        experimentIdx += 1;
      }
    });
    const newRun = {
      key: timestamp.toString(),
      experimentIdx,
      data: initNewFormData(experiment),
      experiment
    };
    // Update list of available runs.
    setRuns(runs.concat(newRun));
    setActiveRun(newRun);
    return newRun;
  };

  const saveActiveRunData = (data: IExperimentData) => {
    if (activeRun) {
      const newActiveRun = Object.assign({}, activeRun, { data });
      setActiveRun(newActiveRun);
      updateRun(activeRun, newActiveRun);
    }
  };

  const saveUploadedRun = (uploadedRun: IRun) => {
    const newUploadedRun = Object.assign({}, uploadedRun);
    updateRun(uploadedRun, newUploadedRun);
  };

  const deleteRun = (runToDelete: IRun) => {
    const idx = getRunIndex(runToDelete);
    const newRuns = runs.slice();
    newRuns.splice(idx, 1);
    setRuns(newRuns);
  };

  const resetRuns = () => {
    setRuns([]);
  };

  return { runs, startNewRun, saveActiveRunData, resetRuns, activeRun, setActiveRun, saveUploadedRun, deleteRun };
};
