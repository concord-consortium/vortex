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
}

export const useRuns = (): IUseRunsResult => {
  const [runs, setRuns] = useLocalStorage<IRun[]>("runs", []);
  const [ activeRun, setActiveRun ] = useState<IRun | null>(null);

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
      // Update active run.
      const newRun = Object.assign({}, activeRun, { data });
      setActiveRun(newRun);
      // Update runs list.
      // Old school `for` loop as we need index anyway. We could use binary search, as runs array will be always
      // sorted by keys/timestamps, but not worth the effort for a few runs.
      let idx = 0;
      for (; idx < runs.length; idx += 1) {
        if (runs[idx].key === activeRun.key) {
          break;
        }
      }
      const newRuns = runs.slice();
      newRuns[idx] = newRun;
      setRuns(newRuns);
    }
  };

  const resetRuns = () => {
    setRuns([]);
  };

  return { runs, startNewRun, saveActiveRunData, resetRuns, activeRun, setActiveRun };
};
