import React from "react";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { Experiment } from "../../shared/components/experiment";

import css from "./experiment-wrapper.module.scss";

interface IProps {
  experiment: IExperiment;
  data: IExperimentData;
  onDataChange: (data: IExperimentData) => void;
  onBackBtnClick: () => void;
}

export const ExperimentWrapper: React.FC<IProps> = ({ experiment, data, onDataChange, onBackBtnClick }) => {
  const { metadata } = experiment;
  const { initials } = metadata;

  return (
    <div>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={onBackBtnClick}>⇦</div>
        <div className={css.headerInitialsIcon}>{initials}</div>
        <div className={css.headerTitle}>TBD</div>
      </div>
      <div className={css.workspace}>
        <Experiment experiment={experiment} data={data} onDataChange={onDataChange}/>
      </div>
    </div>
  );
};
