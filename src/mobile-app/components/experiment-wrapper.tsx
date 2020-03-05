import React from "react";
import { IExperiment, IExperimentConfig, IExperimentData } from "../../shared/experiment-types";
import { Experiment } from "../../shared/components/experiment";
import { Initials } from "../../shared/components/initials";
import { Icon } from "../../shared/components/icon";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";

import css from "./experiment-wrapper.module.scss";

interface IProps {
  experiment: IExperiment;
  experimentIdx: number;
  data: IExperimentData;
  embeddedPreview?: boolean;
  onDataChange: (data: IExperimentData) => void;
  onBackBtnClick: () => void;
  onUpload: () => void;
}

// App specific config. Mobile app shouldn't show labels and it should use sensors.
// LARA app will have different config.
const experimentConfig: IExperimentConfig = {
  hideLabels: true,
  useSensors: true,
  showEditSaveButton: false,
  showCameraButton: true
};

export const ExperimentWrapper: React.FC<IProps> = ({ experiment, experimentIdx, data, onDataChange, onBackBtnClick, onUpload, embeddedPreview}) => {
  const { metadata } = experiment;
  const { initials } = metadata;
  const workSpaceClass = embeddedPreview ? `${css.workspace} ${css.embeddedPreview}`: css.workspace;

  const handleSave = () => {
    // blur the active input element if focused
    (document.activeElement as HTMLElement)?.blur?.();
  };

  let title = null;
  if (experiment.schema.titleField) {
    title = data[experiment.schema.titleField];
  }
  return (
    <div>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={onBackBtnClick}><Icon name="arrow_back"/></div>
        <Initials text={initials} active={true}/>
        <div className={css.headerTitle}>
          <div>{`${experiment.metadata.name} #${experimentIdx}`}</div>
          <div>{title}</div>
        </div>
        <div className={css.headerMenu}>
          <MenuComponent>
            <MenuItemComponent onClick={handleSave}>Save</MenuItemComponent>
            <MenuItemComponent onClick={onUpload}>Upload</MenuItemComponent>
          </MenuComponent>
        </div>
      </div>
      <div className={workSpaceClass}>
        <Experiment experiment={experiment} config={experimentConfig} data={data} onDataChange={onDataChange} />
      </div>
    </div>
  );
};
