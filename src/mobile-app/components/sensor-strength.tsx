// adapted from https://github.com/mbrookes/react-mobile-signal-strength

import React from "react";

import css from "./sensor-strength.module.scss";

interface IProps {
  rssi: number;
}

const minRssi = -90;
const maxRssi = -30;
const rssiRange = maxRssi - minRssi;

export const getStrength = (rssi: number) => {
  // -90 dBm -> -30 dBm : 0 -> 100
  const clippedRssi = rssi > maxRssi ? maxRssi : (rssi < minRssi ? minRssi : rssi);
  const strength = 100 - (100 * ((maxRssi - clippedRssi) / rssiRange));
  return strength;
}

export const SensorStrength: React.FC<IProps> = ({rssi}) => {
  const strength = getStrength(rssi);
  const barStyle = (bar: number) => {
    return {
      borderRadius: 2,
      width: '20%',
      height: `${25 * bar}%`,
      background: strength >= 25 * (bar - 1) + 10 ? 'green' : 'white',
    };
  };

  return (
    <div className={css.sensorStrength}>
      <div style={barStyle(1)} />
      <div style={barStyle(2)} />
      <div style={barStyle(3)} />
      <div style={barStyle(4)} />
    </div>
  );
}

