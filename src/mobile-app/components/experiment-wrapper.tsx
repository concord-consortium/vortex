import React, { useState } from "react";
import classNames from "classnames";
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
  const [inputDisabled, setInputDisabled] = useState(false);
  const { metadata } = experiment;
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
        <div className={classNames(css.headerBackIcon, {[css.disabled]: inputDisabled})} onClick={inputDisabled ? undefined : onBackBtnClick}><Icon name="arrow_back"/></div>
        <Initials metadata={metadata} active={true}/>
        <div className={css.headerTitle}>
          <div className={classNames(css.name, {[css.disabled]: inputDisabled})}>
            {editing
              ? <input defaultValue={`${name}`} onChange={inputDisabled ? undefined : saveExperimentName} onBlur={inputDisabled ? undefined : handleRename} onKeyDown={inputDisabled ? undefined : handleEnter} autoFocus={true} />
              : <div onClick={inputDisabled ? undefined : handleRename}>{name}</div>
            }
          </div>
          <div>{title}</div>
        </div>
        <div className={css.headerMenu}>
          <MenuComponent>
            <MenuItemComponent icon={"label"} disabled={inputDisabled} onClick={handleSave}>Save</MenuItemComponent>
            <MenuItemComponent icon={"upload"} disabled={inputDisabled} onClick={onUpload}>Upload</MenuItemComponent>
            <MenuItemComponent icon={"create"} disabled={inputDisabled} onClick={handleRename}>Rename</MenuItemComponent>
          </MenuComponent>
        </div>
      </div>
      <div className={workSpaceClass}>
        <Experiment
          experiment={experiment}
          config={experimentConfig}
          data={data}
          onDataChange={onDataChange}
          inputDisabled={inputDisabled}
          setInputDisabled={setInputDisabled}
        />
      </div>
    </div>
  );
};
