import React from "react";
import { IRun } from "../hooks/use-runs";

import css from "./run-picker.module.scss";
import { formatTime } from "../../shared/utils/format-time";
import { Initials } from "../../shared/components/initials";

interface IProps {
  runs: IRun[];
  onRunSelect: (run: IRun) => void;
}

export const RunPicker: React.FC<IProps> = ({ runs, onRunSelect }) => {
  return (
    <div className={css.runPicker}>
      <hr/>
      <div className={css.header}>My Saved Experiments</div>
      {
        runs.map(run =>
          <div key={run.key} className={css.run} onClick={onRunSelect.bind(null, run)}>
            <Initials text={run.experiment.metadata.initials}/>
            <div className={css.text}>
              <div>{run.experiment.metadata.name + ` #${run.experimentIdx}`}</div>
              {
                run.experiment.schema.titleField && run.data[run.experiment.schema.titleField] &&
                <div>{run.data[run.experiment.schema.titleField]}</div>
              }
              <div className={css.date}>{formatTime(run.data.timestamp)}</div>
            </div>
          </div>
        )
      }
    </div>
  );
};
