import React, { useEffect } from "react";
import { useState } from "react";
import { SectionButton } from "./section-button";
import { Section } from "./section";
import { ISection, IExperimentData, IExperiment, IExperimentConfig, initNewFormData } from "../experiment-types";
import css from "./experiment.module.scss";
import { IconName } from "./icon";

interface IProps {
  experiment: IExperiment;
  data?: IExperimentData;
  onDataChange?: (newData: IExperimentData) => void;
  config: IExperimentConfig;
  defaultSectionIndex?: number;
}

export const Experiment: React.FC<IProps> = ({ experiment, data, onDataChange, config, defaultSectionIndex }) => {
  const { schema } = experiment;
  const { sections } = schema;
  const [section, setSection] = useState<ISection>(sections[defaultSectionIndex || 0]);
  const [currentData, setCurrentData] = useState<IExperimentData>(data || initNewFormData(experiment));

  const onExperimentDataChange = (newData: IExperimentData) => {
    setCurrentData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  // listen for prop changes from upload
  useEffect(() => {
    if (data) {
      setCurrentData(data);
    }
  }, [data]);

  return (
    <div className={css.experiment}>
      <div className={css.sectionButtons}>
        {
          sections.map(s =>
            <SectionButton
              key={s.title}
              active={s === section}
              title={s.title}
              icon={s.icon as IconName}
              onClick={setSection.bind(null, s)}
            />
          )
        }
      </div>
      <div className={css.sectionContainer}>
        <Section
          section={section}
          experiment={experiment}
          experimentConfig={config}
          formData={currentData}
          onDataChange={onExperimentDataChange}
        />
      </div>
    </div>
  );
};
