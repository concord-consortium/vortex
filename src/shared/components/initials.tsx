import React from "react";
import css from "./initials.module.scss";

interface IProps {
  text: string;
  active?: boolean;
}

export const Initials: React.FC<IProps> = ({ text, active }) => {
  return <div className={css.initialsIcon + ` ${active ? css.active : ""}`}>{text}</div>;
};
