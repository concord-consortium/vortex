import { UiSchema } from "react-jsonschema-form";

export interface IDataSchema {
  // Experiment data should have "object" type.
  type: "object";
  // Every property listed in `properties` list will be eventually rendered in one of the experiment sections.
  properties: {[key: string]: any};
  required?: string[];
}

export interface IFormUiSchema extends UiSchema {
  // Please see the docs: https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#the-uischema-object
  // There's a custom extension of this format that lets you provide "ui:icon". Check Icon component to see list of
  // all available icons or to add a new one.
  "ui:icon"?: "string";
}

export interface ISection {
  title: string;
  icon: string;
  // formFields array should be a subset of dataSchema.properties.
  // Section will render a form with these fields.
  formFields?: string[];
}

export interface IExperimentSchema {
  // JSON Schema description of the experiment data. We allow only specific data type described by IDataSchema.
  dataSchema: IDataSchema;
  // React JSONSchema Form uiSchema, see: https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#the-uischema-object
  formUiSchema?: IFormUiSchema;
  sections: ISection[];
}

export const EXPERIMENT_VERSION_1 = "1.0.0"
export const MAX_SUPPORTED_EXPERIMENT_VERSION = EXPERIMENT_VERSION_1

export interface IExperimentV1 {
  version: "1.0.0";
  metadata: {
    uuid: string;
    name: string;
    initials: string;
  };
  schema: IExperimentSchema;
}

export type IExperiment = IExperimentV1

export interface IExperimentData {
  // This will be injected by ExperimentWrapper automatically on initial load.
  timestamp: number;
  // Other properties are unknown, they're specified by Experiment dataSchema.
}
