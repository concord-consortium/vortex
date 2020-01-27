import React from "react";
import { useExperiments } from "../hooks/use-experiments";
import { IExperiment } from "../../shared/experiment-types";

interface IProps {
  setExperiment: (experiment: IExperiment) => void;
}

export const ExperimentPicker: React.FC<IProps> = ({setExperiment}) => {
  const {experiments, upgradeApp} = useExperiments();

  return (
    <div>
      <h1>Experiments</h1>
      <ul>
        {experiments.map(experiment => {
          const {uuid, name, initials} = experiment.metadata;
          return (
            <li key={uuid} onClick={setExperiment.bind(null, experiment)}>
              {name} ({initials})
            </li>
          );
        })}
      </ul>
      {upgradeApp ? <div>Please upgrade this app to the latest version</div> : undefined}
    </div>
  );
};
