import { useState, useEffect } from "react";
import { Sensor, ISensorValues, SensorEvent, ISensorConnectionEventData, ISensorValuesEventData, ISensorErrorData } from "../../sensors/sensor";
import { logError } from "../../shared/utils/log";

export interface IUseSensorResult {
  connected: boolean;
  deviceName: string | undefined;
  values: ISensorValues;
  error: any | undefined;
}

export const useSensor = (sensor: Sensor | null) => {
  if (!sensor) {
    return {
      connected: false,
      deviceName: undefined,
      values: {},
      error: undefined
    };
  }
  const {connected, deviceName, values} = sensor;
  const [useSensorResult, setUseSensorResult] = useState<IUseSensorResult>({connected, deviceName, values, error: undefined});

  useEffect(() => {
    const onConnection = (data: ISensorConnectionEventData) => {
      setUseSensorResult({
        connected: data.connected,
        deviceName: data.deviceName,
        values: {},
        error: undefined
      });
    };
    const onValues = (data: ISensorValuesEventData) => {
      setUseSensorResult({
        connected: sensor.connected,
        deviceName: data.deviceName,
        values: data.values,
        error: undefined
      });
    };
    const onError = (data: ISensorErrorData) => {
      if (data.error) {
        logError(data.error);
      }
      setUseSensorResult({
        connected: sensor.connected,
        deviceName: data.deviceName,
        values: {},
        error: data.error
      });
    };
    sensor.on(SensorEvent.Connection, onConnection);
    sensor.on(SensorEvent.Values, onValues);
    sensor.on(SensorEvent.Error, onError);

    return () => {
      sensor.off(SensorEvent.Connection, onConnection);
      sensor.off(SensorEvent.Values, onValues);
      sensor.off(SensorEvent.Error, onError);
      sensor.disconnect();
    }
  }, [] /* run on component mount/unmount */ );

  return useSensorResult;
};
