import { UiSchema } from "react-jsonschema-form";
import { JSONSchema6 } from "json-schema";

export interface IDataSchema extends JSONSchema6 {
  // Experiment data should have "object" type.
  type: "object";
  // Every property listed in `properties` list will be eventually rendered in one of the experiment sections.
  properties: {[key: string]: any};
  required?: string[];
}

// Currently there's only one custom form field.
export type CustomFieldName = "dataTable";

export interface IFormUiSchema extends UiSchema {
  // Please see the docs: https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#the-uischema-object
  // There's a custom extension of this format that lets you provide "ui:icon" to every field.
  // Check Icon component to see list of all available icons or to add a new one.
  "ui:icon"?: "string";
  "ui:field"?: CustomFieldName;
  // Custom fields might add their field-specific options to "ui:options" object. For clarity, they should specify
  // them under "ui:<fieldName>Options" key.
  "ui:dataTableOptions"?: {
    // List of properties that should be connected to sensor output.
    sensorFields?: string[];
    // Reference to other form field that should be used as a table title.
    titleField?: string;
  };
}

// For now there's only supported section component - "metadata". In the future, this list might grow.
export type SectionComponentName = "metadata";

export interface ISection {
  title: string;
  icon: string;
  // formFields array should be a subset of dataSchema.properties.
  // Section will render a form with these fields.
  formFields?: string[];
  components?: SectionComponentName[];
}

export interface IExperimentSchema {
  // JSON Schema description of the experiment data. We allow only specific data type described by IDataSchema.
  dataSchema: IDataSchema;
  // React JSONSchema Form uiSchema, see: https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#the-uischema-object
  formUiSchema?: IFormUiSchema;
  // Sections list. Sections specify form fields to render and section components.
  sections: ISection[];
  // Form data property name that will be echoed to the top of the app experiment screen as a title.
  titleField?: string;
  // Form data property name that points to user-defined names for investigation experiments
  customNameField?: string;
}

export const EXPERIMENT_VERSION_1 = "1.0.0";
export const MAX_SUPPORTED_EXPERIMENT_VERSION = EXPERIMENT_VERSION_1;

export interface IExperimentV1 {
  version: "1.0.0";
  metadata: {
    uuid: string;
    name: string;
    initials: string;
  };
  schema: IExperimentSchema;
  data?: IExperimentData;
}

export type IExperiment = IExperimentV1;

export interface IExperimentData {
  // This will be injected by ExperimentWrapper automatically on initial load.
  timestamp?: number;
  // Other properties are unknown, they're specified by Experiment dataSchema.
  [name: string]: any;
}

// New data should be based on initial data provided in the experiment schema + timestamp.
export const initNewFormData = (experiment: IExperiment) => Object.assign({}, experiment.data, { timestamp: Date.now() });

// Custom components listed by sections should accept these properties.
export interface ISectionComponentProps {
  experiment: IExperiment;
  data: IExperimentData;
}

export type SectionComponent = React.FC<ISectionComponentProps>;

export interface IExperimentConfig {
  hideLabels: boolean;
  useSensors: boolean;
  showShowSensorButton: boolean;
  showEditSaveButton: boolean;
  showCameraButton: boolean;
  minCameraWidth?: number;
  minCameraHeight?: number;
}
