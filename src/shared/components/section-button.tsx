import React from "react";
import css from "./section-button.module.scss";

interface IProps {
  title: string;
  onClick?: (event: React.MouseEvent) => void;
}

export const SectionButton: React.FC<IProps> = ({ title, onClick }) =>
  <div className={css.sectionButton} onClick={onClick}>
    { title }
  </div>;
