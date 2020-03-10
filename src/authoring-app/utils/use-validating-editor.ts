import {useState} from "react";
import Ajv, {ErrorObject} from "ajv";
import * as schema from "./experiment-authoring-schema.json";
import { SimpleJsonLint, JSonParseError, IErrorNotation }  from "../utils/simple-json-lint";


const lintJson = (json: string) => {
  try {
    SimpleJsonLint(json);
  }
  catch (e) {
    const error = e as JSonParseError;
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

const customValidation = (content: string) => {
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


export const UseValidatingEditor = (
  initialValue: string,
  validationF: (value:string) => IErrorNotation[] = customValidation) => {

    const [originalValue, setOriginalValue] = useState(initialValue);
    const [editorValue, setEditorValue] = useState(initialValue);
    const [errors, setErrors] = useState([] as IErrorNotation[]);

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

