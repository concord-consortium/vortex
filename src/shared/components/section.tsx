import React from "react";
import {
  IDataSchema,
  IExperiment,
  IExperimentData,
  ISection,
  SectionComponentName,
  SectionComponent, IExperimentConfig
} from "../experiment-types";
import { IChangeEvent } from "react-jsonschema-form";
import { Form, IVortexFormContext } from "./form";
import { Metadata } from "./metadata";
import css from "./section.module.scss";

interface IProps {
  section: ISection;
  experiment: IExperiment;
  formData: IExperimentData;
  onDataChange?: (newData: IExperimentData) => void;
  experimentConfig: IExperimentConfig;
}

const SectionComponent: {[name in SectionComponentName]: SectionComponent} = {
  metadata: Metadata
};

export const Section: React.FC<IProps> = ({ section, experiment, formData, onDataChange, experimentConfig }) => {
  let formSchema: IDataSchema | null = null;
  if (section.formFields && section.formFields.length > 0) {
    const dataSchema = experiment.schema.dataSchema;
    // First, copy data schema without any properties.
    formSchema = Object.assign({}, dataSchema, {properties: {}});
    // Then, copy only listed properties.
    section.formFields.forEach(prop => formSchema!.properties[prop] = dataSchema.properties[prop]);
    if (formSchema.required) {
      formSchema.required = formSchema.required.filter(prop => section.formFields!.indexOf(prop) !== -1);
    }
  }

  const onChange = (event: IChangeEvent<IExperimentData>) => {
    // Immediately save the data.
    onDataChange && onDataChange(event.formData);
  };

  return (
    <div className={css.section}>
      {
        (section.components || []).map(name => {
          const Component = SectionComponent[name];
          return <Component key={name} experiment={experiment} data={formData}/>;
        })
      }
      {
        // Why is there a key? We want to make sure that Form element is fully recreated each time section
        // is changed. We don't really want to reuse the same component instance which has its own internal state,
        // e.g. error list. So, without using key prop, user could see error list from the other section form.
        formSchema &&
        <Form
          key={section.title}
          schema={formSchema}
          uiSchema={experiment.schema.formUiSchema}
          formData={formData}
          onChange={onChange}
          noValidate={true}
          formContext={{
            experiment,
            experimentConfig,
            // Pass the whole form data again, so custom field can access other field values.
            formData
          } as IVortexFormContext}
        >
          {/* Children are used to render custom action buttons. We don't want any, */}
          {/* as form is saving and validating data live. */}
          <span />
        </Form>
      }
    </div>
  );
};
