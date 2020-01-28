import { useState, useEffect } from "react";
import { Sensor, ISensorValues, SensorEvent, ISensorConnectionEventData, ISensorValuesEventData } from "../../sensors/sensor";

export interface IUseSensorResult {
  connected: boolean;
  deviceName: string | undefined;
  values: ISensorValues;
}

export const useSensor = (sensor: Sensor) => {

  const {connected, deviceName, values} = sensor;
  const [useSensorResult, setUseSensorResult] = useState<IUseSensorResult>({connected, deviceName, values});

  useEffect(() => {
    const onConnection = (data: ISensorConnectionEventData) => {
      setUseSensorResult({
        connected: data.connected,
        deviceName: data.deviceName,
        values: {}
      });
    };
    const onValues = (data: ISensorValuesEventData) => {
      setUseSensorResult({
        connected: true,
        deviceName: data.deviceName,
        values: data.values
      });
    };
    sensor.on(SensorEvent.Connection, onConnection);
    sensor.on(SensorEvent.Values, onValues);

    return () => {
      sensor.off(SensorEvent.Connection, onConnection);
      sensor.off(SensorEvent.Values, onValues);
      sensor.disconnect();
    }
  }, [] /* run on component mount/unmount */ );

  return useSensorResult;
};
