import React from "react";
import { IRun } from "../hooks/use-runs";
import { formatTime } from "../../shared/utils/format-time";

import css from "./run-info.module.scss";

interface IProps {
  run: IRun;
  expanded: boolean;
}

export const RunInfoComponent: React.FC<IProps> = ({ run, expanded }) => {

  return (
    <div className={css.runInfo}>
      <div>{run.experiment.metadata.name + ` #${run.experimentIdx}`}</div>
      {expanded &&
        run.experiment.schema.titleField && run.data[run.experiment.schema.titleField] &&
        <div>{run.data[run.experiment.schema.titleField]}</div>
      }
      <div className={css.date}>{formatTime(run.data.timestamp)}</div>
      {expanded &&
         run.experiment.schema.dataSchema.properties.groupMembers && run.data[run.experiment.schema.dataSchema.properties.groupMembers] &&
        <div>{run.data[run.experiment.schema.dataSchema.properties.groupMembers]}</div>
      }
    </div>
  );
};
