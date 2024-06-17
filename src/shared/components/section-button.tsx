import React from "react";
import css from "./section-button.module.scss";
import { Icon, IconName } from "./icon";

interface IProps {
  title: string;
  active: boolean;
  icon: IconName;
  onClick?: (event: React.MouseEvent) => void;
}

export const SectionButton: React.FC<IProps> = ({ title, icon, active, onClick }) =>
  <div className={css.sectionButton} onClick={onClick}>
    <div className={css.icon + (active ? ` ${css.active}` : "")}><Icon name={icon} /></div>
    { title }
  </div>;
