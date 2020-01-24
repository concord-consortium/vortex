export interface IDataSchema {
  // Experiment data should have "object" type.
  type: "object";
  // Every property listed in `properties` list will be eventually rendered in one of the experiment sections.
  properties: {[key: string]: any};
  required?: string[];
}

export interface IFormUiSchema {
  // At this point there are no assumptions about form schema. Keep this type instead of using "any" in case
  // we would like to specify allowed formUiSchema better.
}

export interface ISection {
  title: string;
  // formFields array should be a subset of dataSchema.properties.
  // Section will render a form with these fields.
  formFields?: string[];
}

export interface ITheme {
  // Bootstrap theme is necessary for React JSONSchema Form.
  bootstrapCSS?: string;
  // Optional list of theme CSS files.
  themeCSS?: string[];
}

export interface IExperimentSchema {
  // JSON Schema description of the experiment data. We allow only specific data type described by IDataSchema.
  dataSchema: IDataSchema;
  // React JSONSchema Form uiSchema, see: https://react-jsonschema-form.readthedocs.io/en/latest/form-customization/#the-uischema-object
  formUiSchema?: IFormUiSchema;
  sections: ISection[];
  theme?: ITheme;
}

// The only assumptions that can be made about experiment data is that it's an object.
export type IExperimentData = object;
