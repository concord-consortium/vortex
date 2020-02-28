import { useState, useEffect } from "react";
import { Sensor, ISensorValues, SensorEvent, ISensorConnectionEventData, ISensorValuesEventData, ISensorErrorData } from "../../sensors/sensor";
import { logError } from "../../shared/utils/log";

export interface IUseSensorResult {
  connecting: boolean;
  connected: boolean;
  deviceName: string | undefined;
  values: ISensorValues;
  error: any | undefined;
}

export const useSensor = (sensor: Sensor | null) => {
  if (!sensor) {
    return {
      connecting: false,
      connected: false,
      deviceName: undefined,
      values: {},
      error: undefined
    };
  }
  const {connected, deviceName, values} = sensor;
  const [useSensorResult, setUseSensorResult] = useState<IUseSensorResult>({connecting: false, connected, deviceName, values, error: undefined});

  useEffect(() => {
    const onConnecting = (data: ISensorConnectionEventData) => {
      setUseSensorResult({
        connecting: true,
        connected: false,
        deviceName: undefined,
        values: {},
        error: undefined
      });
    };
    const onConnection = (data: ISensorConnectionEventData) => {
      setUseSensorResult({
        connecting: false,
        connected: data.connected,
        deviceName: data.deviceName,
        values: {},
        error: undefined
      });
    };
    const onValues = (data: ISensorValuesEventData) => {
      setUseSensorResult({
        connecting: false,
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
        connecting: false,
        connected: sensor.connected,
        deviceName: data.deviceName,
        values: {},
        error: data.error
      });
    };
    sensor.on(SensorEvent.Connecting, onConnecting);
    sensor.on(SensorEvent.Connection, onConnection);
    sensor.on(SensorEvent.Values, onValues);
    sensor.on(SensorEvent.Error, onError);

    return () => {
      sensor.off(SensorEvent.Connecting, onConnecting);
      sensor.off(SensorEvent.Connection, onConnection);
      sensor.off(SensorEvent.Values, onValues);
      sensor.off(SensorEvent.Error, onError);
      sensor.disconnect();
    };
  }, [] /* run on component mount/unmount */ );

  return useSensorResult;
};
