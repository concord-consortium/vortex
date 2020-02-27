import React, { useState } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
import css from "./sensor.module.scss";

interface IProps {
  sensor: Sensor;
  onResetAll?: () => void;
  onSetMode?: (mode: "sensor" | "manual") => void;
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

export const SensorComponent: React.FC<IProps> = ({sensor, onResetAll, onSetMode}) => {
  const {connected, deviceName, values, error} = useSensor(sensor);
  const [connecting, setConnecting] = useState(false);

  const handleConnectPromise = (isConnecting: boolean, handler: () => Promise<void>) => {
    setConnecting(isConnecting);
    handler()
      .then(() => sensor.setError(undefined))
      .catch(err => sensor.setError(err))
      .finally(() => setConnecting(false));
  };
  const handleClick = (clickHandler: () => void) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    clickHandler();
  };

  const handleConnect = handleClick(() => handleConnectPromise(true, () => sensor.connect()));
  const handleConnectMenuItem = () => handleConnectPromise(true, () => sensor.connect());
  const handleDisconnectMenuItem = () => handleConnectPromise(false, () => sensor.disconnect());
  const handleResetAllMenuItem = () => onResetAll?.();
  const handleSensorModeMenuItem = () => onSetMode?.("sensor");
  const handleManualModeMenuItem = () => onSetMode?.("manual");
  const handleShowPlotsMenuItem = () => /* TBD */ undefined;
  const handleSaveButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    // the save button does nothing for now
    e.preventDefault();
    e.stopPropagation();
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
    <div className={css.connectionLabel}>
      {renderIcon("disconnected")}
      No Sensor Connected
    </div>
  );

  const renderConnecting = () => (
    <div className={css.connectionLabel}>
      {renderIcon("connected")}
      Connecting...
    </div>
  );

  const renderConnected = () => (
    <div className={css.connectionLabel}>
      {renderIcon("connected")}
      Connected: {deviceName}
    </div>
  );

  const renderMenu = () => {
    // disable show plots menu item for initial testing
    const addShowPlotsMenuItem = false;
    return (
      <MenuComponent>
        {onResetAll ? <MenuItemComponent onClick={handleResetAllMenuItem}>Reset All</MenuItemComponent> : undefined}
        {connected
          ? <MenuItemComponent onClick={handleDisconnectMenuItem}>Disconnect</MenuItemComponent>
          : <MenuItemComponent onClick={handleConnectMenuItem}>Connect</MenuItemComponent>
        }
        { addShowPlotsMenuItem ? <MenuItemComponent onClick={handleShowPlotsMenuItem}>Show Plots (TDB)</MenuItemComponent> : undefined}
        {onSetMode ? <MenuItemComponent onClick={handleSensorModeMenuItem}>Sensor Mode</MenuItemComponent> : undefined}
        {onSetMode ? <MenuItemComponent onClick={handleManualModeMenuItem}>Manual Entry</MenuItemComponent> : undefined}
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
  const connectionClassName = `${css.connection} ${error ? css.error : ""}`;
  return (
    <div className={css.sensor}>
      <div className={connectionClassName} onClick={connecting || connected ? undefined : handleConnect}>
        {error ? renderError() : (connected ? renderConnected() : (connecting ? renderConnecting() : renderDisconnected()))}
        <button className={css.saveButton} onClick={handleSaveButton}>Save</button>
        {renderMenu()}
      </div>
      {renderValues()}
    </div>
  );
};
