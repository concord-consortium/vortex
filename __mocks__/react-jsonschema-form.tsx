import React from "react";

export default class Form extends React.Component<any, any> {
  public triggerChange(newData: any) {
    this.props.onChange({ formData: newData });
  };

  public render() {
    return null;
  }
}

export function withTheme(theme: any) {
  return Form;
}
