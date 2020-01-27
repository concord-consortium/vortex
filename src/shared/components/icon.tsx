import React from "react";
import Label from "material-icons-svg/components/baseline/Label";
import SettingsInputAntenna from "material-icons-svg/components/baseline/SettingsInputAntenna";
import Assignment from "material-icons-svg/components/baseline/Assignment";
import People from "material-icons-svg/components/baseline/People";

// Use material icon names as a key, so it's easier to define these icons in form UI schema:
// https://material.io/resources/icons/?style=baseline
const Icons: {[key: string]: any} = {
  label: Label,
  settings_input_antenna: SettingsInputAntenna,
  assignment: Assignment,
  people: People
};

interface IProps {
  name: string;
  fill?: string;
  size?: "small" | "medium" | "large";
}

const SIZE: {[key: string]: number} = {
  medium: 30,
  large: 40
};

const DEF_FILL = "#646464";
const DEF_SIZE = "medium";

export const Icon: React.FC<IProps> = ({ name, fill, size }) => {
  const Component = Icons[name];
  const fontSize = SIZE[size || DEF_SIZE];
  return <Component fill={fill || DEF_FILL} fontSize={fontSize} />;
};
