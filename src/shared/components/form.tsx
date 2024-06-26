import { withTheme } from 'react-jsonschema-form';
import { FieldTemplate } from "./field-template";
import { DataTableField } from "./data-table-field";
// React JSON Schema uses Bootstrap semantics, so provide a bootstrap CSS and custom theme.
import "./boostrap-3.3.7.scss";
import "./bootstrap-vortex-theme.scss";
import { IExperiment, IExperimentConfig, IExperimentData } from "../experiment-types";
import { Sensor } from "../../sensors/sensor";
import { PhotoOrNoteField } from './photo-or-note-field';

export interface IVortexFormContext {
  experiment: IExperiment;
  experimentConfig: IExperimentConfig;
  formData: IExperimentData;
  inputDisabled?: boolean;
  setInputDisabled?: React.Dispatch<React.SetStateAction<boolean>>;
  sensor?: Sensor;
}

const VortexFormTheme = {
  FieldTemplate,
  fields: {
    dataTable: DataTableField,
    photo: PhotoOrNoteField
  }
};

export const Form = withTheme(VortexFormTheme);
