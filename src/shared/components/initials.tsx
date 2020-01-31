import React from "react";
import css from "./initials.module.scss";

interface IProps {
  text: string;
}

export const Initials: React.FC<IProps> = ({ text }) => {
  return <div className={css.initialsIcon}>{text}</div>;
};
