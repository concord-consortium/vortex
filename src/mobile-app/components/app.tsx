import React from "react";
import { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { Experiment } from "../../shared/components/experiment";
import { IExperiment } from "../../shared/experiment-types";

import css from "./app.module.scss";

export const AppComponent: React.FC<{}> = () => {

  const [experiment, setExperiment] = useState<IExperiment|undefined>();

  return (
    <div className={css.app}>
      {experiment
        ? <Experiment experiment={experiment} setExperiment={setExperiment} />
        : <ExperimentPicker setExperiment={setExperiment} />
      }
    </div>
  );
};
