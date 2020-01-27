import React from "react";
import { IExperiment } from "../../shared/experiment-types";
import { Experiment } from "../../shared/components/experiment";

import css from "./experiment-wrapper.module.scss";

interface IProps {
  experiment: IExperiment;
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentWrapper: React.FC<IProps> = ({ experiment, setExperiment }) => {
  const { metadata: {initials} } = experiment;

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={setExperiment?.bind(null, undefined)}>⇦</div>
        <div className={css.headerInitialsIcon}>{initials}</div>
        <div className={css.headerTitle}>TBD</div>
      </div>
      <div className={css.workspace}>
        <Experiment experiment={experiment} />
      </div>
    </div>
  );
};
