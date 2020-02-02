import React from "react";
import ReactDOM from "react-dom";
import { Experiment } from "./components/experiment";
import { IExperiment } from "./experiment-types";
import ExperimentJSONs from "../data/experiments.json";

import "./index.sass";

const mobileAppConfig = {
  hideLabels: true,
  useSensors: true
};

const experiment = ExperimentJSONs[0] as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment}
      config={mobileAppConfig}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      {JSON.stringify(experiment, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-1")
);
