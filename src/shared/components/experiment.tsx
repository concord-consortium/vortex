import React, { useEffect } from "react";
import { useState } from "react";
import { SectionButton } from "./section-button";
import { Section } from "./section";
import { ISection, IExperimentData, IExperiment } from "../experiment-types";
import css from "./experiment.module.scss";

const DEFAULT_BOOTSTRAP_CSS = "../shared/themes/bootstrap-flatly.css";

interface IProps {
  experiment: IExperiment;
  data?: IExperimentData;
  onDataChange?: (newData: IExperimentData) => void;
  setExperiment?: (experiment: IExperiment) => void;
}

const addCSS = (href: string, asFirst = false) => {
  const head = document.getElementsByTagName('head')[0];
  const link = document.createElement('link');
  link.id = href;
  link.href = href;
  link.rel = "stylesheet";
  link.crossOrigin = "anonymous";
  if (asFirst) {
    head.prepend(link);
  } else {
    head.appendChild(link);
  }
};

const removeCSS = (href: string) => {
  const link = document.getElementById(href);
  if (link) {
    const head = document.getElementsByTagName('head')[0];
    head.removeChild(link);
  }
};

export const Experiment: React.FC<IProps> = ({ experiment, setExperiment, data, onDataChange }) => {
  const { metadata: {initials}, schema } = experiment;
  const { sections } = schema;
  const [section, setSection] = useState<ISection>(sections[0]);
  const [currentData, setCurrentData] = useState<IExperimentData>(data || {});

  useEffect(() => {
    // Append bootstrap css before our custom styles.
    addCSS(schema.theme?.bootstrapCSS || DEFAULT_BOOTSTRAP_CSS, true);
    schema.theme?.themeCSS?.forEach(link => addCSS(link));
    return () => {
      removeCSS(schema.theme?.bootstrapCSS || DEFAULT_BOOTSTRAP_CSS);
      schema.theme?.themeCSS?.forEach(link => removeCSS(link));
    }
  }, []);

  const onExperimentDataChange = (newData: IExperimentData) => {
    setCurrentData(newData);
    if (onDataChange) {
      onDataChange(newData);
    }
  };

  return (
    <div className={css.experiment}>
      <div className={css.header}>
        <div className={css.headerBackIcon} onClick={setExperiment?.bind(null, undefined)}>←</div>
        <div className={css.headerInitialsIcon}>{initials}</div>
        <div className={css.headerTitle}>TBD</div>
      </div>
      <div className={css.workspace}>
        <div className={css.sectionButtons}>
          {
            sections.map(s =>
              <SectionButton key={s.title} title={s.title} onClick={setSection.bind(null, s)}/>
            )
          }
        </div>
        <div className={css.sectionContainer}>
          <Section
            section={section}
            dataSchema={schema.dataSchema}
            formUiSchema={schema.formUiSchema}
            formData={currentData}
            onDataChange={onExperimentDataChange}
          />
        </div>
      </div>
    </div>
  );
};
