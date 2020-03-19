import React from "react";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-solarized_dark";
import * as css from "./json-editor.scss";
import { IErrorNotation } from "../hooks/use-validating-editor";


interface IProps {
  value: string;
  update?: (json: string) => void;
  errors: IErrorNotation[];
  width: string;
  height: string;
}

export const JSONEditor: React.FC<IProps> = (props: IProps) => {
    const { width, height, value, update, errors } = props;

    return (
      <div className={css.jsonEditor}>
        {errors.length > 0 && <div className={css.customValidationError}>{errors[0]?.text}</div>}
        <AceEditor
          value={value}
          onChange={update}
          focus={true}
          mode="json"
          theme="solarized_dark"
          enableBasicAutocompletion={true}
          enableLiveAutocompletion={true}
          annotations={errors}
          setOptions={{ useWorker: false }}
          width={width}
          height={height}
          fontSize='12pt'
        />
      </div>
    );
};

