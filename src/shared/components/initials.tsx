import React from "react";
import css from "./initials.module.scss";
import { IExperimentMetadata } from "../experiment-types";
import { useIconStyle } from "../../mobile-app/hooks/use-icon-style";

interface IProps {
  metadata: IExperimentMetadata;
  active?: boolean;
}

export const Initials: React.FC<IProps> = ({ metadata, active }) => {
  const {style, handleMouseOut, handleMouseOver} = useIconStyle(metadata);
  return <div className={css.initialsIcon + ` ${active ? css.active : ""}`} style={style} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>{metadata.initials}</div>;
};
