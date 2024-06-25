import React, { useState, useRef, useMemo, useEffect } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor, IConnectDevice, SelectDeviceFn, ITimeSeriesCapabilities, MaxNumberOfTimeSeriesValues, ISensorValues } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
import { inCordova } from "../../shared/utils/in-cordova";
import { SensorStrength } from "./sensor-strength";
import { Icon } from "../../shared/components/icon";
import { IDataTableTimeData } from "../../shared/components/data-table-field";
import DataTableSparkGraph from "../../shared/components/data-table-sparkgraph";

import css from "./sensor.module.scss";

interface ISensorSelectorProps {
  devices: IConnectDevice[];
  selectDevice: SelectDeviceFn;
  cancel: () => void;
}

const maxTime = 3;

export const SensorSelectorComponent: React.FC<ISensorSelectorProps> = ({devices, selectDevice, cancel}) => {
  const sortedDevices = devices.sort((a, b) => a.id.localeCompare(b.id));
  const handleCancel = () => cancel();
  return (
    <div className={css.sensorSelector}>
      <div className={css.sensorSelectorHeader}>
        <div className={css.sensorSelectorHeaderTitle}>Choose a sensor...</div>
        <div className={css.sensorSelectorHeaderButtons}>
          <div className={css.sensorSelectorHeaderButton} onClick={handleCancel}>Cancel</div>
        </div>
      </div>
      {sortedDevices.map((device, index) => {
        const handleSelectDevice = () => selectDevice(device);
        return (
          <div key={index} className={css.sensorSelectorItem} onClick={handleSelectDevice}>
            <div className={css.sensorSelectorItemName}>{device.name}</div>
            <div className={css.sensorSelectorItemRssi}>
              <SensorStrength rssi={device.adData.rssi} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface ISensorComponentProps {
  sensor: Sensor;
  manualEntryMode?: boolean;
  setManualEntryMode?: (flag: boolean) => void;
  isTimeSeries: boolean;
  timeSeriesCapabilities?: ITimeSeriesCapabilities;
  selectableSensorId?: any;
  setTimeSeriesMeasurementPeriod?: (measurementPeriod: number) => void;
  setSelectableSensorId?: (id: any) => void;
}

const iconClass = {
  connected: css.connectedIcon,
  disconnected: css.disconnectedIcon,
  error: css.errorIcon
};

const iconClassHi = {
  connected: css.connectedIconHi,
  disconnected: css.disconnectedIconHi,
  error: css.errorIcon
};

export const SensorComponent: React.FC<ISensorComponentProps> = ({sensor, manualEntryMode, setManualEntryMode, isTimeSeries, timeSeriesCapabilities, selectableSensorId, setTimeSeriesMeasurementPeriod, setSelectableSensorId}) => {
  const {connected, connecting, deviceName, values, error} = useSensor(sensor);

  const [devicesFound, setDevicesFound] = useState<IConnectDevice[]>([]);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const selectDevice = useRef<SelectDeviceFn|undefined>();
  const cancelSelectDevice = useRef<CancelDeviceFn|undefined>();

  // generate a sliding window of time series values
  const latestValuesRef = useRef<IDataTableTimeData[]>([]);
  useEffect(() => {
    if (!sensor.connected || !isTimeSeries || !timeSeriesCapabilities) {
      latestValuesRef.current = [];
      return;
    }

    const valueKey = timeSeriesCapabilities.valueKey as keyof ISensorValues;
    const timeDelta = sensor.pollInterval / 1000;
    const hasValues = latestValuesRef.current.length > 0;
    let latestTime = hasValues ? latestValuesRef.current[latestValuesRef.current.length - 1].time : 0;
    let nextTime = hasValues ? latestTime + timeDelta : 0;
    if (latestTime >= maxTime) {
      nextTime = maxTime;
      latestTime = maxTime;
      latestValuesRef.current = latestValuesRef.current.slice(1).map(({value}, index) => {
        return {value, time: index * timeDelta};
      });
    }
    latestValuesRef.current.push({value: values[valueKey] ?? 0, time: nextTime});
    latestValuesRef.current[0].capabilities = timeSeriesCapabilities;
  }, [isTimeSeries, sensor, timeSeriesCapabilities, values]);

  const timeSeriesPeriods = useMemo(() => {
    if (!timeSeriesCapabilities) {
      return [];
    }

    const {measurementPeriod, minMeasurementPeriod, defaultMeasurementPeriod} = timeSeriesCapabilities;

    const result: number[] = [10, 20, 50, 200, 500, 1000, 2000, 10000, measurementPeriod, defaultMeasurementPeriod, minMeasurementPeriod]
        .filter(n => n >= minMeasurementPeriod)
        .filter((item, pos, self) => self.indexOf(item) === pos);
    result.sort((a, b) => b - a);
    return result;
  }, [timeSeriesCapabilities]);

  const clearSelectDevice = () => {
    selectDevice.current = undefined;
    cancelSelectDevice.current = undefined;
    setShowDeviceSelect(false);
  };

  const handleSelectDevice = (device: IConnectDevice) => {
    selectDevice.current?.(device);
    clearSelectDevice();
  };

  const handleCancelSelectDevice = () => {
    cancelSelectDevice.current?.();
    clearSelectDevice();
  };

  const handleMeasurementPeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = parseInt(e.target.value, 10);
    setTimeSeriesMeasurementPeriod?.(newPeriod);
  };

  const handleSelectSelectableSensor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectableSensorId?.(e.target.value);
  };

  const connect = () => sensor.connect({
    onDevicesFound: ({devices, select, cancel}) => {
      setDevicesFound(devices);
      selectDevice.current = select;
      cancelSelectDevice.current = cancel;
      setShowDeviceSelect(true);
    }
  }).catch(() => sensor.disconnect());
  const disconnect = () => {
    sensor.disconnect();
    clearSelectDevice();
  };

  const renderIcon = (icon: "connected" | "disconnected" | "error") => (
    <div className={css.statusIcon}>
      <div className={iconClass[icon]} />
      <div className={iconClassHi[icon]} />
    </div>
  );

  const renderError = () => (
    <div className={css.connectionLabel}>
      {renderIcon("error")}
      {error.toString()}
    </div>
  );

  const renderDisconnected = () => (
    <div className={css.connectionLabel} onClick={connect}>
      {renderIcon("disconnected")}
      No Sensor Connected
    </div>
  );

  const renderConnecting = () => (
    <div className={css.connectionLabel}>
      {renderIcon("connected")}
      {inCordova ? "Searching..." : "Connecting..."}
    </div>
  );

  const renderDeviceName = () => {
    if (sensor.selectableSensors.length === 0) {
      return <>{deviceName}</>;
    }

    return (
      <select onChange={handleSelectSelectableSensor}>
        {sensor.selectableSensors.map(s => <option key={s.internalId} value={s.internalId}>{s.name}</option>)}
      </select>
    );
  };

  const renderConnected = () => (
    <div className={css.connectionLabel}>
      {renderIcon("connected")}
      Connected: {renderDeviceName()}
    </div>
  );

  const renderMenu = () => {
    const canSwitchModes = !!setManualEntryMode;
    const setSensorMode = () => setManualEntryMode?.(false);
    const setEditMode = () => setManualEntryMode?.(true);

    return (
      <MenuComponent>
        {manualEntryMode && canSwitchModes
          ? <MenuItemComponent onClick={setSensorMode} icon="sensor">Sensor Mode</MenuItemComponent>
          : <>
              {connected ? <MenuItemComponent onClick={disconnect}>Disconnect</MenuItemComponent> : <MenuItemComponent icon="settings_input_antenna" onClick={connect}>Connect</MenuItemComponent>}
              {canSwitchModes ? <MenuItemComponent onClick={setEditMode} icon="create">Edit Mode</MenuItemComponent> : undefined}
            </>}
      </MenuComponent>
    );
  };

  const renderTimeSeries = () => {
    if (!timeSeriesCapabilities) {
      return <div className={css.timeSeriesValue} />;
    }

    const {measurementPeriod, measurement, units} = timeSeriesCapabilities;
    const valueKey = timeSeriesCapabilities.valueKey as keyof ISensorValues;
    const sampleRate = measurementPeriod / 1000;
    const maxSampleTime = sampleRate * MaxNumberOfTimeSeriesValues;
    const value = values[valueKey];
    const displayValue = value !== undefined ? value.toFixed(1) : "--";

    return (
      <div className={css.timeSeriesValue}>
        <div className={css.tsvLeft}>
          <div className={css.tsvGraph}>
            <DataTableSparkGraph
              width={25}
              height={50}
              values={latestValuesRef.current}
              minTime={0}
              maxTime={maxTime}
              showAxes={true}
              redrawSignal={Date.now()}
            />
            <div className={css.tsvValue}>
              <div>{displayValue}</div>
              <div>{units}</div>
            </div>
          </div>
          <div className={css.tsvMeasurement}>
            {measurement}
          </div>
        </div>
        <div className={css.tsvSeparator} />
        <div className={css.tsvRight}>
          <div className={css.tsvInfo}>
            <div className={css.tsvInfoRow}>
              <div>Samples:</div>
              <div>
                <select className={css.tsvSampleRate} value={measurementPeriod} onChange={handleMeasurementPeriodChange}>
                  {timeSeriesPeriods.map(p => <option key={p} value={p}>{`${(1000 / p)}/sec`}</option>)}
                </select>
              </div>
            </div>
            <div className={css.tsvInfoRow}>
              <div>Max Time:</div>
              <div>{maxSampleTime} secs</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderValues = () => {
    const fragments: JSX.Element[] = [];
    if (sensor.capabilities.temperature) {
      const fragment = <SensorValue
        key="temperature"
        connected={connected}
        value={values.temperature}
        fixedWidth={1}
        unit="C"
        label="Temperature"
      />;
      fragments.push(fragment);
    }
    if (sensor.capabilities.humidity) {
      const fragment = <SensorValue
        key="humidity"
        connected={connected}
        value={values.humidity}
        fixedWidth={1}
        unit="%"
        label="Relative Humidity"
      />;
      fragments.push(fragment);
    }
    if (sensor.capabilities.illuminance) {
      const fragment = <SensorValue
        key="illuminance"
        connected={connected}
        value={values.illuminance}
        fixedWidth={0}
        unit="lux"
        label="Light"
      />;
      fragments.push(fragment);
    }
    const className = connected ? css.connectedValues : css.disconnectedValues;
    return (
      <div className={className}>
        {fragments}
      </div>
    );
  };

  if (manualEntryMode) {
    return (
      <div className={css.connection}>
        <div className={css.editModeText}><Icon name="create" /> Edit values in the data table</div>
        {renderMenu()}
      </div>
    );
  }

  const connectionClassName = `${css.connection} ${error ? css.error : ""}`;
  return (
    <div className={css.sensor}>
      <div className={connectionClassName}>
        {error ? renderError() : (connected ? renderConnected() : (connecting ? renderConnecting() : renderDisconnected()))}
        {renderMenu()}
      </div>
      {showDeviceSelect ? <SensorSelectorComponent devices={devicesFound} selectDevice={handleSelectDevice} cancel={handleCancelSelectDevice} /> : undefined}
      {isTimeSeries ? renderTimeSeries() : renderValues()}
    </div>
  );
};

