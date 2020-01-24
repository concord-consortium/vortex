import React from "react";
import { useState } from "react";
import { ExperimentPicker } from "./experiment-picker";
import { Experiment } from "../../shared/components/experiment";
import { IExperiment } from "../../shared/experiment-schema-types";

import css from "./app.module.scss";

export const AppComponent: React.FC<{}> = () => {

  const [experiment, setExperiment] = useState<IExperiment|undefined>();

  const renderExperiment = (experimentToRender: IExperiment) => {
    return (
      <div>
        <Experiment experiment={experimentToRender} />
        <div>
          <button onClick={setExperiment.bind(null, undefined)}>(for testing click to return to experiment list)</button>
        </div>
      </div>
    )
  }

  return (
    <div className={css.app}>
      {experiment ? renderExperiment(experiment) : <ExperimentPicker setExperiment={setExperiment} />}
    </div>
  );
};
