import {useState} from "react";
import Ajv, {ErrorObject} from "ajv";
import * as schema from "../utils/experiment-authoring-schema.json";

import LinesAndColumns from "lines-and-columns";

export interface IErrorNotation {
  row: number;
  column: number;
  type: 'warning'|'error'|'info';
  text: string;
  position: number;
}


// Provides better JSON Parsing error expierence
class JSonParseError extends Error {
  public errorRecord: IErrorNotation;

  constructor(error: Error, json: string) {
      super(error.message);
      this.errorRecord = {
        type: 'error',
        text: this.message,
        row: -1,
        column: -1,
        position: -1
      };

      const flatMessage = this.message.replace(/\n/g, '');
      const indexMatch = flatMessage.match(/at position (\d+)/);
      if (indexMatch && indexMatch.length > 0) {
        const lines = new LinesAndColumns(json);
        const index = Number(indexMatch[1]);
        const location = lines.locationForIndex(index);
        if(location) {
          this.errorRecord.row = location.line;
          this.errorRecord.column = location.column;
          this.errorRecord.position = index;
        }
      }
  }
}

/*
* Ensure that JSON is parsable.
* Returns array of errors. Empty array if clean.
*/
const lintJson = (json: string) => {
	try {
    JSON.parse(json);
  } catch (e) {
    const error = new JSonParseError(e, json);
    return [error.errorRecord];
  }
  return [];
};

const errorForAJVError = (error:ErrorObject) => {
  const errNotation: IErrorNotation = {
    text: `Schema Error: ${error.dataPath}: ${error.message}`,
    position: 1,
    row: 1,
    column: 1,
    type: 'error'
  };
  return errNotation;
};

// Compare the editor content with the Schema:
const schemaValidation = (content: string) => {
  // Ensure that we can parse the JSON first:
  const errors = lintJson(content);
  if (errors.length > 0) {
    return errors;
  }
  const ajv = new Ajv();
  const parsedObject = JSON.parse(content);
  const validate = ajv.compile(schema);
  const valid = validate(parsedObject);
  if(!valid && validate.errors) {
    return validate.errors.map(errorForAJVError);
  }
  return [];
};

// State magement for content, dirty, and invalid JSON in the editor:
export const UseValidatingEditor = (
  initialValue: string,
  validationF: (value:string) => IErrorNotation[] = schemaValidation) => {

    const [originalValue, setOriginalValue] = useState(initialValue);
    const [editorValue, setEditorValue] = useState(initialValue);
    const [errors, setErrors] = useState<IErrorNotation[]>([]);

    const updateEditorValue = (newValue: string) => {
      setEditorValue(newValue);
      const errs = validationF(newValue);
      setErrors(errs);
    };

    const revert = () => {
      setEditorValue(originalValue);
    };

    const isValid = editorValue.length > 0 && errors.length === 0;
    const editorDirty = editorValue !== originalValue;

    return { updateEditorValue, revert, isValid, editorDirty, errors,
      editorValue, setEditorValue, setOriginalValue, originalValue };
};

