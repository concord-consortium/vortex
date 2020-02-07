import React, { useState } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";

import css from "./sensor.module.scss";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";

interface IProps {
  sensor: Sensor;
  onResetAll?: () => void;
  onSetMode?: (mode: "sensor" | "manual") => void;
}

export const SensorComponent: React.FC<IProps> = ({sensor, onResetAll, onSetMode}) => {
  const {connected, deviceName, values, error} = useSensor(sensor);
  const [showMenu, setShowMenu] = useState(false);
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
  const handleMenuItem = (menuItemHandler: () => void) => handleClick(() => {
    setShowMenu(false);
    menuItemHandler();
  });

  const handleConnect = handleClick(() => handleConnectPromise(true, () => sensor.connect()));

  const handleMenuIcon = handleClick(() => setShowMenu(!showMenu));

  const handleConnectMenuItem = () => handleConnectPromise(true, () => sensor.connect());
  const handleDisconnectMenuItem = () => handleConnectPromise(false, () => sensor.disconnect());
  const handleResetAllMenuItem = () => onResetAll?.();
  const handleSensorModeMenuItem = () => onSetMode?.("sensor");
  const handleManualModeMenuItem = () => onSetMode?.("manual");
  const handleShowPlotsMenuItem = () => /* TBD */ undefined;

  const renderError = () => {
    return (
      <div className={css.connectionLabel}>
        <div className={css.errorIcon} />
        {error.toString()}
      </div>
    );
  };

  const renderDisconnected = () => {
    return (
      <div className={css.connectionLabel}>
        <div className={css.disconnectedIcon} />
        No Sensor Connected
      </div>
    );
  };

  const renderConnecting = () => {
    return (
      <div className={css.connectionLabel}>
        <div className={css.disconnectedIcon} />
        Connecting...
      </div>
    );
  };

  const renderConnected = () => {
    return (
      <div className={css.connectionLabel}>
        <div className={css.connectedIcon} />
        Connected: {deviceName}
      </div>
    );
  };

  const renderMenu = () => {
    return (
      <MenuComponent>
        {onResetAll ? <MenuItemComponent onClick={handleResetAllMenuItem}>Reset All</MenuItemComponent> : undefined}
        {connected
          ? <MenuItemComponent onClick={handleDisconnectMenuItem}>Disconnect</MenuItemComponent>
          : <MenuItemComponent onClick={handleConnectMenuItem}>Connect</MenuItemComponent>
        }
        <MenuItemComponent onClick={handleShowPlotsMenuItem}>Show Plots (TDB)</MenuItemComponent>
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
        unit="°C"
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
  const connectionClassName = `${css.connection} ${error ? css.error : (connected ? css.connected : css.disconnected)}`;
  return (
    <div className={css.sensor}>
      <div className={connectionClassName} onClick={connecting || connected ? undefined : handleConnect}>
        {error ? renderError() : (connected ? renderConnected() : (connecting ? renderConnecting() : renderDisconnected()))}
        {renderMenu()}
      </div>
      {renderValues()}
    </div>
  );
};
