import * as React from "react";
import JSONInput from "react-json-editor-ajrm";

import * as css from "./json-editor.scss";

interface IProps {
  initialValue?: object;
  onChange?: (jsObject: object) => void;
  validate?: (jsObject: object) => { valid: boolean; error: string; };
  width: string;
  height: string;
}

interface IState {
  customValidationError: string | null;
}

let ID = 0;
const getID = () => {
  return ID++;
};

export default class JSONEditor extends React.Component<IProps, IState> {
  public state: IState = {
    customValidationError: null
  };
  private id = getID();

  public componentDidUpdate(prevProps: IProps) {
    if (prevProps.initialValue !== this.props.initialValue) {
      this.customValidation(this.props.initialValue);
    }
  }

  public render() {
    const { initialValue, width, height } = this.props;
    const { customValidationError } = this.state;
    return (
      <div className={css.jsonEditor}>
        {customValidationError && <div className={css.customValidationError}>{customValidationError}</div>}
        <JSONInput
          id={this.id}
          placeholder={initialValue}
          onChange={this.handleJSONChange}
          width={width}
          height={height}
        />
      </div>
    );
  }

  public handleJSONChange = (data: any) => {
    if (!data.jsObject) {
      // There is some syntax error. Docs:
      // https://github.com/AndrewRedican/react-json-editor-ajrm#content-values
      return;
    }
    const { onChange } = this.props;
    if (this.customValidation(data.jsObject) && onChange) {
      onChange(data.jsObject);
    }
  }

  private customValidation(jsObject: any) {
    const { validate } = this.props;
    if (!validate) {
      return true;
    }
    const validationResult = validate(jsObject);
    if (!validationResult.valid) {
      this.setState({customValidationError: validationResult.error});
      return false;
    }
    this.setState({customValidationError: null});
    return true;
  }
}
