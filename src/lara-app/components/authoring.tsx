import React, { useState } from "react";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
import { IExperiment } from "../../shared/experiment-types";

import css from "./authoring.module.scss";

const experiments = require("../../data/experiments.json") as Experiments;

interface IProps {
  experiment?: IExperiment;
  setAuthoredState: (state: IAuthoredState) => void;
}

export interface IAuthoredState {
  version: "1.0";
  experimentId?: string;
}

export const AuthoringComponent = (props : IProps) => {
  const [experimentId, setExperimentId] = useState<string|undefined>(props.experiment?.metadata.uuid);

  const handleSelectExperiment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExperimentId(e.target.value);
    const authoredState: IAuthoredState = {
      version: "1.0",
      experimentId: e.target.value
    };
    props.setAuthoredState(authoredState);
  };

  return (
    <div className={css.authoring}>
      <div className={css.header}>Select Experiment</div>
      <select onChange={handleSelectExperiment} value={experimentId}>
        <>
          <option key="none" value="">Please select...</option>
          {experiments.map(experiment => {
            const {uuid, name} = experiment.metadata;
            return <option key={uuid} value={uuid}>{name}</option>;
          })}
        </>
      </select>
    </div>
  );
};
