import React, { useState, useEffect } from "react";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
const experiments = require("../../data/experiments.json") as Experiments;

import css from "./authoring.module.scss";
import { IExperiment } from "../../shared/experiment-types";

interface Props {
  experiment?: IExperiment;
  phone: any;
}

export interface AuthoredState {
  version: "1.0";
  experimentId?: string;
}

export const AuthoringComponent = (props : Props) => {
  const [experimentId, setExperimentId] = useState<string|undefined>(props.experiment?.metadata.uuid);

  const handleSelectExperiment = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExperimentId(e.target.value);
    props.phone.post("authoredState", {
      version: "1.0",
      experimentId: e.target.value
    } as AuthoredState);
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
      <div className={css.note}>Once you select an experiment please click the "Save authored state" button above to save your choice.</div>
    </div>
  );
};
