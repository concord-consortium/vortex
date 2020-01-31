import React from "react";
import { Initials } from "./initials";
import css from "./metadata.module.scss";
import { SectionComponent } from "../experiment-types";
import { formatTime } from "../utils/format-time";

export const Metadata: SectionComponent = ({ experiment, data }) => {
  return (
    <div className={css.metadata}>
      <div className={css.main}>
        <Initials text={experiment.metadata.initials}/>
        <div className={css.text}>
          <div className={css.name}>{experiment.metadata.name}</div>
          <div className={css.timestamp}>{formatTime(data.timestamp)}</div>
        </div>
      </div>
      <hr/>
    </div>
  );
};
