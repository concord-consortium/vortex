import React, { useState } from "react";
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

// App specific config. Mobile app shouldn't show labels and it should use sensors without having to use the collect button.
// LARA app will have different config.
const experimentConfig: IExperimentConfig = {
  hideLabels: true,
  useSensors: true,
  showShowSensorButton: false,
  showEditSaveButton: false,
  showCameraButton: true
};

export const ExperimentWrapper: React.FC<IProps> = ({ experiment, experimentIdx, data, onDataChange, onBackBtnClick, onUpload, embeddedPreview }) => {
  const [editing, isEditing ] = useState(false);
  const { metadata } = experiment;
  const { initials } = metadata;
  const workSpaceClass = embeddedPreview ? `${css.workspace} ${css.embeddedPreview}`: css.workspace;

  const handleSave = () => {
    // blur the active input element if focused
    (document.activeElement as HTMLElement)?.blur?.();
  };

  const handleRename = () => {
    if (editing) {
      onDataChange(data);
    }
    isEditing(!editing);
  };
  const handleEnter = (e: any) => {
    if (e.keyCode === 13) {
      if (editing) {
        handleRename();
      }
    }
  };
  const saveExperimentName = (el: any) => {
    const newName = el.currentTarget.value;
    if (newName) {
      data.customName = newName;
    }
  };

  let title = null;
  if (experiment.schema.titleField) {
    title = data[experiment.schema.titleField];
  }
  let name = metadata.name + ` #${experimentIdx}`;
  if (data.customName) {
    name = data.customName;
  }
  return (
    <div>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={onBackBtnClick}><Icon name="arrow_back"/></div>
        <Initials text={initials} active={true}/>
        <div className={css.headerTitle}>
          {editing &&
            <div className={css.editing}>
              <input defaultValue={`${name}`} onChange={saveExperimentName} onBlur={handleRename} onKeyDown={handleEnter}/>
            </div>
          }
          {!editing &&
            <div><span className={css.nameDisplay} onClick={handleRename}>{name}</span></div>
          }
          <div>{title}</div>
        </div>
        <div className={css.headerMenu}>
          <MenuComponent>
            <MenuItemComponent icon={"label"} onClick={handleSave}>Save</MenuItemComponent>
            <MenuItemComponent icon={"upload"} onClick={onUpload}>Upload</MenuItemComponent>
            <MenuItemComponent icon={"create"} onClick={handleRename}>Rename</MenuItemComponent>
          </MenuComponent>
        </div>
      </div>
      <div className={workSpaceClass}>
        <Experiment experiment={experiment} config={experimentConfig} data={data} onDataChange={onDataChange} />
      </div>
    </div>
  );
};
