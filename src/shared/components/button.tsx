import * as React from "react";
import css from "./button.module.scss";

interface IProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default class Button extends React.Component<IProps, {}> {
  public render() {
    const { label, children, disabled, className } = this.props;
    return (
      <span
        className={css.button + " " + (disabled ? css.disabled : "") + (className ? className : "")}
        onClick={this.handleClick}
      >
        <span className={css.label}>{label || children}</span>
      </span>
    );
  }

  private handleClick = (e: React.MouseEvent) => {
    if (this.props.disabled) {
      return;
    }
    this.props.onClick(e);
  }
}
