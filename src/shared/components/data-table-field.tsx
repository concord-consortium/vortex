import React from "react";
import { FieldProps } from "react-jsonschema-form";
import css from "./data-table-field.module.scss";
import { MockSensor } from "../../sensors/mock-sensor";
import { AllCapabilities, Sensor } from "../../sensors/sensor";
import { SensorComponent } from "../../mobile-app/components/sensor";
import { IVortexFormContext } from "./form";
import { getURLParam } from "../utils/get-url-param";
import { DeviceSensor } from "../../sensors/device-sensor";

const useMockSensor = getURLParam("mockSensor") || false;

let sensorInstance: Sensor | null = null;
const getSensor = () => {
  if (!sensorInstance) {
    if (useMockSensor) {
      sensorInstance = new MockSensor({
        capabilities: AllCapabilities,
        pollInterval: 500,
        deviceName: "Mocked Sensor"
      });
    } else {
      sensorInstance = new DeviceSensor({
        capabilities: AllCapabilities
      });
    }
  }
  return sensorInstance;
};

export const DataTableField: React.FC<FieldProps> = props => {
  const formContext: IVortexFormContext = props.formContext;
  const useSensors = formContext.experimentConfig.useSensors;
  return (
    <div className={css.dataTable}>
      { useSensors && <SensorComponent sensor={getSensor()} />}
    </div>
  );
};
