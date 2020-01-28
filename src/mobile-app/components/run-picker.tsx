import React from "react";
import { IRun } from "./types";

import css from "./run-picker.module.scss";

interface IProps {
  runs: IRun[];
  setRunKey: (key: string) => void;
}

export const RunPicker: React.FC<IProps> = ({ runs, setRunKey }) => {
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
            <div key={run.key} className={css.run} onClick={setRunKey.bind(null, run.key)}>
              <div>{ name + ` #${count[name]}` }</div>
              <div>{ new Date(run.data.timestamp).toString() }</div>
            </div>
          );
        })
      }
    </div>
  );
};
