import React from "react";
import { IExperiment } from "../../shared/experiment-types";

import css from "./experiment-picker-item.module.scss";

interface IProps {
  experiment: IExperiment;
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPickerItem: React.FC<IProps> = ({experiment, setExperiment}) => {
  const {name} = experiment.metadata;
  const buttonColor = (initials: string) => {
    switch (initials) {
      case "SS":
        return css.SS;
      case "SI":
        return css.SI;
      default:
        return;
    }
  };

  return (
    <div className={css.item} onClick={setExperiment.bind(null, experiment)}>
      <div className={`${css.icon} ${buttonColor(experiment.metadata.initials)}`}>+</div>
      <div className={css.title}>
        {name}
      </div>
    </div>
  );
};
