import React from "react";
import { Initials } from "./initials";
import css from "./metadata.module.scss";
import { SectionComponent } from "../experiment-types";

const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: "short", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", hour12: true
};

export const Metadata: SectionComponent = ({ experiment, data }) => {
  const date = new Date(data.timestamp);
  return (
    <div className={css.metadata}>
      <div className={css.main}>
        <Initials text={experiment.metadata.initials}/>
        <div className={css.text}>
          <div className={css.name}>{experiment.metadata.name}</div>
          <div className={css.timestamp}>{date.toLocaleString("en-US", dateOptions)}</div>
        </div>
      </div>
      <hr/>
    </div>
  );
};
