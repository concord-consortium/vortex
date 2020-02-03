import React from "react";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { Experiment } from "../../shared/components/experiment";
import { Initials } from "../../shared/components/initials";

import css from "./experiment-wrapper.module.scss";

interface IProps {
  experiment: IExperiment;
  experimentIdx: number;
  data: IExperimentData;
  onDataChange: (data: IExperimentData) => void;
  onBackBtnClick: () => void;
}

export const ExperimentWrapper: React.FC<IProps> = ({ experiment, experimentIdx, data, onDataChange, onBackBtnClick }) => {
  const { metadata } = experiment;
  const { initials } = metadata;
  let title = null;
  if (experiment.schema.titleField) {
    title = data[experiment.schema.titleField];
  }
  return (
    <div>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={onBackBtnClick}>⇦</div>
        <Initials text={initials}/>
        <div className={css.headerTitle}>
          <div>{`${experiment.metadata.name} #${experimentIdx}`}</div>
          <div>{title}</div>
        </div>
      </div>
      <div className={css.workspace}>
        <Experiment experiment={experiment} data={data} onDataChange={onDataChange}/>
      </div>
    </div>
  );
};
