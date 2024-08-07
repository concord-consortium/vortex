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
import Photo from "../icons/photo-24px.svg";
import Comment from "../icons/comment-24px.svg";
import TableChart from "../icons/table_chart-24px.svg";
import Create from "../icons/create-24px.svg";
import Sensor from "../icons/sensor.svg";
import UploadCloud from "../icons/cloud_upload-24px.svg";
import Delete from "../icons/delete-24px.svg";
import Record from "../icons/record.svg";
import RecordDataTrial from "../icons/record-data-trial.svg";
import ReRecordDataTrial from "../icons/re-record-data-trial.svg";
import StopDataTrial from "../icons/stop-data-trial.svg";
import DeleteDataTrial from "../icons/delete-data-trial.svg";
import More from "../icons/more-button.svg";
import Disconnect from "../icons/sensor-disconnect.svg";

const Icons = {
  label: Label,
  settings_input_antenna: SettingsInputAntenna,
  assignment: Assignment,
  group: Group,
  camera: Camera,
  note_and_photo: NoteAndPhoto,
  replay: Replay,
  arrow_back: ArrowBack,
  menu: Menu,
  add_circle: AddCircle,
  photo: Photo,
  comment: Comment,
  collect: TableChart,
  create: Create,
  sensor: Sensor,
  upload: UploadCloud,
  delete: Delete,
  record: Record,
  recordDataTrial: RecordDataTrial,
  reRecordDataTrial: ReRecordDataTrial,
  stopDataTrial: StopDataTrial,
  deleteDataTrial: DeleteDataTrial,
  more: More,
  disconnect: Disconnect
};
export type IconName = keyof typeof Icons;

interface IProps {
  name: IconName;
}

export const Icon: React.FC<IProps> = ({ name }) => {
  const Component = Icons[name];
  if (Component) {
    return <Component />;
  }
  return null;
};
