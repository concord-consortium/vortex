import React from "react";
import { IRun } from "../hooks/use-runs";

import css from "./run-picker.module.scss";

interface IProps {
  runs: IRun[];
  onRunSelect: (run: IRun) => void;
}

export const RunPicker: React.FC<IProps> = ({ runs, onRunSelect }) => {
  const count: {[name: string]: number} = {};

  return (
    <div className={css.runPicker}>
      <hr />
      <div className={css.header}>My Saved Experiments</div>
      {
        runs.map(run => {
          const name = run.experiment.metadata.name;
          if (!count[name]) {
            count[name] = 1;
          } else {
            count[name] += 1;
          }
          return (
            <div key={run.key} className={css.run} onClick={onRunSelect.bind(null, run)}>
              <div>{ name + ` #${count[name]}` }</div>
              <div>{ new Date(run.data.timestamp).toString() }</div>
            </div>
          );
        })
      }
    </div>
  );
};
