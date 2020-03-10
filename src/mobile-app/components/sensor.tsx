import React, { useState, useRef } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor, IConnectDevice, SelectDeviceFn } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
import { inCordova } from "../../shared/utils/in-cordova";
import { SensorStrength } from "./sensor-strength";
import { Icon } from "../../shared/components/icon";

import css from "./sensor.module.scss";

interface ISensorSelectorProps {
  devices: IConnectDevice[];
  selectDevice: SelectDeviceFn;
  cancel: () => void;
}

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

export const SensorComponent: React.FC<ISensorComponentProps> = ({sensor, manualEntryMode, setManualEntryMode}) => {
  const {connected, connecting, deviceName, values, error} = useSensor(sensor);

  const [devicesFound, setDevicesFound] = useState<IConnectDevice[]>([]);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const selectDevice = useRef<SelectDeviceFn|undefined>();
  const cancelSelectDevice = useRef<CancelDeviceFn|undefined>();

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

  const connect = () => sensor.connect({
    onDevicesFound: ({devices, select, cancel}) => {
      setDevicesFound(devices);
      selectDevice.current = select;
      cancelSelectDevice.current = cancel;
      setShowDeviceSelect(true);
    }
  }).catch(() => sensor.disconnect());
  const disconnect = () => sensor.disconnect();

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
    <div className={css.connectionLabel}>
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

  const renderConnected = () => (
    <div className={css.connectionLabel}>
      {renderIcon("connected")}
      Connected: {deviceName}
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
              {connected ? <MenuItemComponent onClick={disconnect}>Disconnect</MenuItemComponent> : <MenuItemComponent onClick={connect}>Connect</MenuItemComponent>}
              {canSwitchModes ? <MenuItemComponent onClick={setEditMode} icon="create">Edit Mode</MenuItemComponent> : undefined}
            </>}
      </MenuComponent>
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
      {renderValues()}
    </div>
  );
};

