import React, { useState } from "react";

import css from "./lara-authoring.module.scss";
import { IExperiment } from "../../shared/experiment-types";
import { UseS3, S3Status } from "../hooks/use-s3";
import { ResourceListing } from "./resource-listing";
import { GetS3Config } from "../utils/getS3Config";

export interface IAuthoredState {
  version: string;
  experimentId?: string;
}

interface IProps {
  authoredState: IAuthoredState|null;
  experiment?: IExperiment;
  phone: any;
}

// TODO: More robust validation:
const isValidExperiment = (experiment: IExperiment) => {
  return (experiment?.metadata?.uuid && experiment?.metadata.name);
};

export const LaraAuthoringComponent = (props : IProps) => {
  const { s3Resource, resourceObject: selectedResource,
    resources, refreshList, resourceObject, status,
    selectFn } = UseS3(GetS3Config());
  const [experimentId, setExperimentId] = useState<string|undefined>(props.authoredState?.experimentId);

  const disabled = status !== S3Status.Ready;
  if(!s3Resource) {
    if(experimentId) {
      const foundResouce = resources.find(r=> r.id === experimentId);
      if(foundResouce) {
        selectFn(foundResouce);
      }
    }
  }
  const saveLaraAuthorState = (experiment: IExperiment) => {
    if(s3Resource && experimentId !== s3Resource.id) {
      const authoredState: IAuthoredState ={
        version: experiment?.version,
        experimentId: s3Resource?.id
      };
      props.phone.post("authoredState", authoredState);
      setExperimentId(s3Resource.id);
    }
  };

  const RenderSelected = () => {
    if(resourceObject) {
      // A selected and valid experiment:
      if(isValidExperiment(resourceObject)) {
        // const save = () => saveLaraAuthorState(resourceObject as IExperiment);
        saveLaraAuthorState(resourceObject as IExperiment);
        return(
          <div className={css.selectedName}>
            {resourceObject?.metadata?.name}
          </div>
        );
      }
      else {
        // Selected, but it isn't valid:
        return (
          <div className={css.invalidExperiment}>
            Can't parse experiment
          </div>
        );
      }
    }
     // no experiment specificed.
    return null;
  };

  return (
    <div className={css.authoring}>
      <RenderSelected />
      <div className={css.header}>Choose Experiment</div>
        <ResourceListing
          disabled={disabled}
          resources={resources}
          resource={s3Resource}
          selectFn={selectFn}
          refreshListFn={refreshList}
        />
      <div className={css.note}>Once you select an experiment please click the "Save authored state" button above to save your choice.</div>
      <div className={css.note}>If you would like, you can create a
      new experiment template, <a target="_blank" href="/authoring-app/">using an external editor.</a></div>
    </div>
  );
};
