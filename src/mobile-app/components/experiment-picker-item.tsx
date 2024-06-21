import React from "react";
import { IExperiment } from "../../shared/experiment-types";
import { useIconStyle } from "../hooks/use-icon-style";

import css from "./experiment-picker-item.module.scss";

interface IProps {
  experiment: IExperiment;
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPickerItem: React.FC<IProps> = ({experiment, setExperiment}) => {
  const {name} = experiment.metadata;
  const {style, handleMouseOut, handleMouseOver} = useIconStyle(experiment.metadata);

  return (
    <div className={css.item} onClick={setExperiment.bind(null, experiment)} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      <div className={css.icon} style={style}>+</div>
      <div className={css.title}>
        {name}
      </div>
    </div>
  );
};
