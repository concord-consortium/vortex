import React from "react";
import { useState } from "react";
import { SectionButton } from "./section-button";
import { Section } from "./section";
import { ISection, IExperimentData, IExperiment } from "../experiment-types";
import css from "./experiment.module.scss";

interface IProps {
  experiment: IExperiment;
  data?: IExperimentData;
  onDataChange?: (newData: IExperimentData) => void;
}

export const Experiment: React.FC<IProps> = ({ experiment, data, onDataChange }) => {
  const { schema } = experiment;
  const { sections } = schema;
  const [section, setSection] = useState<ISection>(sections[0]);
  const [currentData, setCurrentData] = useState<IExperimentData>(data || { timestamp: Date.now() });

  const onExperimentDataChange = (newData: IExperimentData) => {
    setCurrentData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  return (
    <div className={css.experiment}>
      <div className={css.sectionButtons}>
        {
          sections.map(s =>
            <SectionButton
              key={s.title}
              active={s === section}
              title={s.title}
              icon={s.icon}
              onClick={setSection.bind(null, s)}
            />
          )
        }
      </div>
      <div className={css.sectionContainer}>
        <Section
          section={section}
          experiment={experiment}
          formData={currentData}
          onDataChange={onExperimentDataChange}
        />
      </div>
    </div>
  );
};
