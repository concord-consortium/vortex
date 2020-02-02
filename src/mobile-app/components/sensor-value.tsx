import React from "react";

import css from "./sensor-value.module.scss";

interface IProps {
  connected: boolean;
  value?: number;
  fixedWidth: number;
  unit: string;
  label: string;
}

export const SensorValue: React.FC<IProps> = (props) => {
  const {connected, value, fixedWidth, unit, label} = props;

  const renderValue = () => {
    const valueClassName = connected ? css.connectedValue : css.disconnectedValue;
    const renderedValue = connected && value !== undefined ? value.toFixed(fixedWidth) : "--";
    return (
      <div className={valueClassName}>
        {renderedValue} {unit}
      </div>
    )
  };

  const className = `${css.sensorValue} ${connected ? css.connected : css.disconnected}`;
  return (
    <div className={className}>
      <div className={css.sensorInnerValue}>
        <div className={css.value}>{renderValue()}</div>
        <div className={css.label}>{label}</div>
      </div>
    </div>
  );
};
