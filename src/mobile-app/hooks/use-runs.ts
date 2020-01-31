import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { useLocalStorage } from "./use-local-storage";

export interface IRun {
  key: string;
  experiment: IExperiment;
  data: IExperimentData;
}

export interface IUseRunsResult {
  runs: IRun[];
  addNewRun: (experiment: IExperiment) => IRun;
  saveRunData: (runKey: string, data: IExperimentData) => void;
  resetRuns: () => void;
}

export const useRuns = (): IUseRunsResult => {
  const [runs, setRuns] = useLocalStorage<IRun[]>("runs", []);

  const addNewRun = (experiment: IExperiment) => {
    const timestamp = Date.now();
    const newRun = {
      key: timestamp.toString(),
      data: { timestamp },
      experiment
    };
    // Update list of available runs.
    setRuns(runs.concat(newRun));
    return newRun;
  };

  const saveRunData = (runKey: string, data: IExperimentData) => {
    // Old school `for` loop as we need index anyway. We could use binary search, as runs array will be always
    // sorted by keys/timestamps, but not worth the effort for a few runs.
    let idx = 0;
    for (; idx < runs.length; idx += 1) {
      if (runs[idx].key === runKey) {
        break;
      }
    }
    const run = runs[idx];
    if (run) {
      const newRun = Object.assign({}, run, { data });
      const newRuns = runs.slice();
      newRuns[idx] = newRun;
      setRuns(newRuns);
    }
  };

  const resetRuns = () => {
    setRuns([]);
  };

  return { runs, addNewRun, saveRunData, resetRuns };
};
