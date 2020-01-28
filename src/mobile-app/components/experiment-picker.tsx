import React from "react";
import { ExperimentPickerItem } from "./experiment-picker-item";
import { IExperiment } from "../../shared/experiment-types";

import css from "./experiment-picker.module.scss";

interface IProps {
  experiments: IExperiment[];
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPicker: React.FC<IProps> = ({experiments, setExperiment}) => {
  return (
    <div>
      <div className={css.header}>
        <div className={css.headerIcon}>CC</div>
        <div className={css.headerTitle}>
          Concord Consortium's<br/>Data Collector
        </div>
      </div>
      <div className={css.workspace}>
        <div className={css.workspaceTitle}>
          Experiments
        </div>
        <div className={css.workspaceItems}>
          {experiments.map(experiment => (
            <ExperimentPickerItem
              key={experiment.metadata.uuid}
              experiment={experiment}
              setExperiment={setExperiment}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
