import React from "react";
import classNames from "classnames";
import css from "./section-button.module.scss";
import { Icon, IconName } from "./icon";

interface IProps {
  title: string;
  active: boolean;
  icon: IconName;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
}

export const SectionButton: React.FC<IProps> = ({ title, icon, active, disabled, onClick }) => {
  // NOPHOTO: Removed the photo element due to iOS build issues
  if (title === "Note & Photo") {
    title = "Notes";
  }
  return (
    <div className={classNames(css.sectionButton, {[css.disabled]: disabled})} onClick={disabled ? undefined : onClick}>
      <div className={css.icon + (active ? ` ${css.active}` : "")}><Icon name={icon} /></div>
      { title }
    </div>
  );
};
