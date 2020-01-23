import React, { useEffect } from "react";
import { useState } from "react";
import { SectionButton } from "./section-button";
import { Section } from "./section";
import { ISection, IExperimentSchema, IExperimentData } from "../experiment-schema-types";
import css from "./experiment.module.scss";
import { IExperiment } from "../../mobile-app/hooks/use-experiments";

const DEFAULT_BOOTSTRAP_CSS = "../shared/themes/bootstrap-flatly.css";

interface IProps {
  experiment: IExperiment;
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

export const Experiment: React.FC<IProps> = ({ experiment }) => {
  const { schema } = experiment;
  const { sections } = schema;
  const [section, setSection] = useState<ISection>(sections[0]);
  const [experimentData, setExperimentData] = useState<IExperimentData>({});

  useEffect(() => {
    // Append bootstrap css before our custom styles.
    addCSS(schema.theme?.bootstrapCSS || DEFAULT_BOOTSTRAP_CSS, true);
    schema.theme?.themeCSS?.forEach(link => addCSS(link));
    return () => {
      removeCSS(schema.theme?.bootstrapCSS || DEFAULT_BOOTSTRAP_CSS);
      schema.theme?.themeCSS?.forEach(link => removeCSS(link));
    }
  }, []);

  return (
    <div className={css.experiment}>
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
          formData={experimentData}
          onDataChange={setExperimentData}
        />
      </div>
    </div>
  );
};
