import React from "react";
import { ExperimentWrapper } from "../../mobile-app/components/experiment-wrapper";
import { IExperiment } from "../../shared/experiment-types";
import * as css from "./mobile-preview.module.scss";

const validate = (experimentMaybe: Partial<IExperiment>) => {
  // TOOD: Really validate it?
  return (experimentMaybe && experimentMaybe.metadata);
};

const errors = (expimentDef: Partial<IExperiment>) => {
  // TODO: Return validation errors
  return "Invalid Experiment Data";
};


const saveActiveRunData = (data: any) => null;
const exitExperiment = () => null;
const onUpload = () => null;

export interface IMobilePreviewParams {
  experiment: IExperiment;
}
export const MobilePreview = (params: IMobilePreviewParams) => {
  const { experiment } = params;
  return (
    validate(experiment)
    ?
      <div className={css.mobilePreview}>
        <ExperimentWrapper
          embeddedPreview={true}
          experiment={experiment}
          experimentIdx={1}
          data={{}}
          onDataChange={saveActiveRunData}
          onBackBtnClick={exitExperiment}
          onUpload={onUpload}
        />
      </div>
    :
      <div className={css.previewError}>{errors(experiment)}</div>
  );
};
