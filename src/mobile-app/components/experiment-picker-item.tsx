import React from "react";
import { IExperiment } from "../../shared/experiment-types";

import css from "./experiment-picker-item.module.scss";

interface IProps {
  experiment: IExperiment;
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPickerItem: React.FC<IProps> = ({experiment, setExperiment}) => {
  const {name} = experiment.metadata;

  return (
    <div className={css.item} onClick={setExperiment.bind(null, experiment)}>
      <div className={css.icon}>+</div>
      <div className={css.title}>
        {name}
      </div>
    </div>
  );
};
