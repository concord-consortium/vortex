import { IExperiment, IExperimentData } from "../../shared/experiment-types";

export interface IRun {
  key: string;
  experiment: IExperiment;
  data: IExperimentData;
}
