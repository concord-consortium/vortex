import React from "react";
import { IDataSchema, IExperimentData, IFormUiSchema, ISection } from "../experiment-types";
import { IChangeEvent } from "react-jsonschema-form";
import { Form } from "./form";
import css from "./section.module.scss";

interface IProps {
  section: ISection;
  dataSchema: IDataSchema;
  formUiSchema?: IFormUiSchema;
  formData: IExperimentData;
  onDataChange?: (newData: IExperimentData) => void;
}

export const Section: React.FC<IProps> = ({ section, dataSchema, formUiSchema, formData, onDataChange }) => {
  let formSchema: IDataSchema | null = null;
  if (section.formFields && section.formFields.length > 0) {
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
        // Why is there a key? We want to make sure that Form element is fully recreated each time section
        // is changed. We don't really want to reuse the same component instance which has its own internal state,
        // e.g. error list. So, without using key prop, user could see error list from the other section form.
        formSchema &&
        <Form
          key={section.title}
          schema={formSchema}
          uiSchema={formUiSchema}
          formData={formData}
          onChange={onChange}
        >
          {/* Children are used to render custom action buttons. We don't want any, */}
          {/* as form is saving and validating data live. */}
          <span />
        </Form>
      }
    </div>
  );
};
