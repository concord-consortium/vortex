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
  inputDisabled?: boolean;
  setInputDisabled?: React.Dispatch<React.SetStateAction<boolean>>;
  log?: (action: string, data?: object | undefined) => void;
}

export const Experiment: React.FC<IProps> = ({ experiment, data, onDataChange, config, defaultSectionIndex, inputDisabled, setInputDisabled, log }) => {
  const { schema } = experiment;
  const { sections } = schema;
  const [section, setSection] = useState<ISection>(sections[defaultSectionIndex || 0]);
  const [currentData, setCurrentData] = useState<IExperimentData>(data || initNewFormData(experiment));

  const handleSetSection = (s: ISection) => {
    log?.("selectSection", {title: s.title});
    setSection(s);
  };

  const onExperimentDataChange = (newData: IExperimentData) => {
    log?.("experimentDataChange");
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
              disabled={inputDisabled}
              onClick={handleSetSection.bind(null, s)}
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
          inputDisabled={inputDisabled}
          setInputDisabled={setInputDisabled}
          onDataChange={onExperimentDataChange}
          log={log}
        />
      </div>
    </div>
  );
};
