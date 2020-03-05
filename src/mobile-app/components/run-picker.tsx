import React, { useState } from "react";
import { IRun } from "../hooks/use-runs";
import { Initials } from "../../shared/components/initials";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
import { Icon } from "../../shared/components/icon";
import { RunInfoComponent } from "./run-info";
import css from "./run-picker.module.scss";

interface IProps {
  runs: IRun[];
  onRunSelect: (run: IRun) => void;
  onRunUpload?: (run: IRun) => void;
  onRunEdit?: (run: IRun) => void;
  onRunDelete?: (run: IRun) => void;
}

export const RunPicker: React.FC<IProps> = ({ runs, onRunSelect, onRunUpload, onRunDelete, onRunEdit }) => {
  const [expandedRunInfo, setExpandedRunInfo] = useState<string>("");
  const renderMenu = (run: IRun) => {
    if (onRunEdit || onRunUpload || onRunDelete) {
      return (
        <div className={css.options}>
          <div className={css.expandToggle} onClick={onExpandRun.bind(null,run.key)}><div className={`${css.icon} ${expandedRunInfo === run.key ? css.expanded : undefined}`}>^</div></div>
          <div className={css.centerOffset}>
            {onRunUpload ? <div className={css.uploadButton} onClick={onRunUpload.bind(null, run)}>
              <div className={css.icon}><Icon name="upload" /></div><div className={css.text}>Upload</div></div> : undefined}
          </div>
          <div className={css.menuContainer}>
            <MenuComponent>
              {onRunEdit ? <MenuItemComponent icon={"create"} onClick={onRunEdit.bind(null, run)}>Edit</MenuItemComponent> : undefined}
              {onRunUpload ? <MenuItemComponent icon={"upload"} onClick={onRunUpload.bind(null, run)}>Upload</MenuItemComponent> : undefined}
              {onRunDelete ? <MenuItemComponent icon={"delete"} onClick={onRunDelete.bind(null, run)}>Delete</MenuItemComponent> : undefined}
            </MenuComponent>
          </div>
        </div>
      );
    }
  };

  const onExpandRun = (runKey: string) => {
    if (expandedRunInfo === runKey) {
      setExpandedRunInfo("");
    } else {
      setExpandedRunInfo(runKey);
    }
  };

  return (
    <div className={css.runPicker}>
      <hr/>
      <div className={css.header}>My Saved Experiments</div>
      {
        runs.map(run =>
          <div key={run.key} className={css.runContainer}>
            <div key={run.key} className={css.run} onClick={onRunSelect.bind(null, run)}>
              <Initials text={run.experiment.metadata.initials}/>
              <div className={css.text}>
                <RunInfoComponent run={run} expanded={run.key === expandedRunInfo} />
              </div>
            </div>
            <div>
              {renderMenu(run)}
            </div>
          </div>
        )
      }
    </div>
  );
};
