import React from "react";
import Label from "../icons/label-24px.svg";
import SettingsInputAntenna from "../icons/settings_input_antenna-24px.svg";
import Assignment from "../icons/assignment-24px.svg";
import Group from "../icons/group_add-24px.svg";
import Camera from "../icons/camera-24px.svg";
import NoteAndPhoto from "../icons/note_and_photo-24px.svg";
import Replay from "../icons/replay-24px.svg";
import ArrowBack from "../icons/arrow_back-24px.svg";
import Menu from "../icons/menu-24px.svg";
import AddCircle from "../icons/add_circle-24px.svg";

const Icons: {[key: string]: any} = {
  label: Label,
  settings_input_antenna: SettingsInputAntenna,
  assignment: Assignment,
  group: Group,
  camera: Camera,
  note_and_photo: NoteAndPhoto,
  replay: Replay,
  arrow_back: ArrowBack,
  menu: Menu,
  add_circle: AddCircle
};

interface IProps {
  name: string;
}

export const Icon: React.FC<IProps> = ({ name }) => {
  const Component = Icons[name];
  return <Component />;
};
