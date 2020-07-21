import React from "react";
import { ExperimentPickerItem } from "./experiment-picker-item";
import { useExperiments } from "../hooks/use-experiments";
import { IExperiment } from "../../shared/experiment-types";

import css from "./experiment-picker.module.scss";

interface IProps {
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPicker: React.FC<IProps> = ({setExperiment}) => {
  const {experiments, upgradeApp} = useExperiments();

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerIcon}/>
        <div className={css.headerTitle}>
          Monitor Your World
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
        {upgradeApp ? <div>Please upgrade this app to the latest version</div> : undefined}
      </div>
    </div>
  );
};
