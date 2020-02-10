import React from "react";
import { IRun } from "../hooks/use-runs";
import { Initials } from "../../shared/components/initials";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
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

  const renderMenu = (run: IRun) => {
    if (onRunEdit || onRunUpload || onRunDelete) {
      return (
        <MenuComponent>
          {onRunEdit ? <MenuItemComponent onClick={onRunEdit.bind(null, run)}>Edit</MenuItemComponent> : undefined}
          {onRunUpload ? <MenuItemComponent onClick={onRunUpload.bind(null, run)}>Upload</MenuItemComponent> : undefined}
          {onRunDelete ? <MenuItemComponent onClick={onRunDelete.bind(null, run)}>Delete</MenuItemComponent> : undefined}
        </MenuComponent>
      );
    }
  };

  return (
    <div className={css.runPicker}>
      <hr/>
      <div className={css.header}>My Saved Experiments</div>
      {
        runs.map(run =>
          <div key={run.key} className={css.run} onClick={onRunSelect.bind(null, run)}>
            <Initials text={run.experiment.metadata.initials}/>
            <div className={css.text}>
              <RunInfoComponent run={run} />
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
