import React from "react";
import { useExperiments } from "../hooks/use-experiments";
import { IExperiment } from "../../shared/experiment-types";

interface IProps {
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPicker: React.FC<IProps> = ({setExperiment}) => {
  const experiments = useExperiments();

  return (
    <div>
      <h1>Experiments</h1>
      <ul>
        {experiments.map(experiment => {
          return (
            <li key={experiment.uuid} onClick={setExperiment.bind(null, experiment)}>
              {experiment.name} ({experiment.initials})
            </li>
          );
        })}
      </ul>
    </div>
  );
};
