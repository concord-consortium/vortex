import React, { useState } from "react";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
const experiments = require("../../data/experiments.json") as Experiments;

import css from "./authoring.module.scss";
import { IExperiment } from "../../shared/experiment-types";

interface IProps {
  experiment?: IExperiment;
  phone: any;
}

export interface IAuthoredState {
  version: "1.0";
  experimentId?: string;
}

export const AuthoringComponent = (props : IProps) => {
  const [experimentId, setExperimentId] = useState<string|undefined>(props.experiment?.metadata.uuid);

  const handleSelectExperiment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExperimentId(e.target.value);
    props.phone.post("authoredState", {
      version: "1.0",
      experimentId: e.target.value
    } as IAuthoredState);
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
