import * as React from "react";
import css from "./button.module.scss";

interface IProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  children?: React.Component[]|string;
  disabled?: boolean;
  className?: string;
}

export const Button:React.FC<IProps> = (props: IProps) => {
  const handleClick = (e: React.MouseEvent) => {
    if (props.disabled) {
      return;
    }
    props.onClick(e);
  };

  const { label, children, disabled, className } = props;
  return (
    <span
      className={css.button + " " + (disabled ? css.disabled : "") +  " " + (className ? className : " ")}
      onClick={handleClick}
    >
      <span className={css.label}>{label || children}</span>
    </span>
  );
};


