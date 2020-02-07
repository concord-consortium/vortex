import React from "react";
import { IRun } from "../hooks/use-runs";
import { formatTime } from "../../shared/utils/format-time";

import css from "./run-info.module.scss";

interface IProps {
  run: IRun;
}

export const RunInfoComponent: React.FC<IProps> = ({ run }) => {

  return (
    <div className={css.runInfo}>
      <div>{run.experiment.metadata.name + ` #${run.experimentIdx}`}</div>
      {
        run.experiment.schema.titleField && run.data[run.experiment.schema.titleField] &&
        <div>{run.data[run.experiment.schema.titleField]}</div>
      }
      <div className={css.date}>{formatTime(run.data.timestamp)}</div>
    </div>
  );
};
