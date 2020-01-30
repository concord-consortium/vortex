import React, { useState } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";

import css from "./sensor.module.scss";

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
      .finally(() => setConnecting(false))
  }
  const handleClick = (clickHandler: () => void) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    clickHandler();
  }
  const handleMenuItem = (menuItemHandler: () => void) => handleClick(() => {
    setShowMenu(false);
    menuItemHandler();
  });

  const handleConnect = handleClick(() => handleConnectPromise(true, () => sensor.connect()));

  const handleMenuIcon = handleClick(() => setShowMenu(!showMenu));

  const handleConnectMenuItem = handleMenuItem(() => handleConnectPromise(true, () => sensor.connect()));
  const handleDisconnectMenuItem = handleMenuItem(() => handleConnectPromise(false, () => sensor.disconnect()));
  const handleResetAllMenuItem = handleMenuItem(() => onResetAll?.());
  const handleSensorModeMenuItem = handleMenuItem(() => onSetMode?.("sensor"));
  const handleManualModeMenuItem = handleMenuItem(() => onSetMode?.("manual"));
  const handleShowPlotsMenuItem = handleMenuItem(() => /* TBD */ undefined);

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
  }

  const renderMenuIcon = () => {
    return (
      <div className={css.menuIcon} onClick={handleMenuIcon}>
        ...
        {showMenu ? renderMenu() : undefined}
      </div>
    );
  }

  const renderMenu = () => {
    return (
      <div className={css.menu}>
        {onResetAll ? <div className={css.menuItem} onClick={handleResetAllMenuItem}>Reset All</div> : undefined}
        {connected
          ? <div className={css.menuItem} onClick={handleDisconnectMenuItem}>Disconnect</div>
          : <div className={css.menuItem} onClick={handleConnectMenuItem}>Connect</div>
        }
        <div className={css.menuItem} onClick={handleShowPlotsMenuItem}>Show Plots (TDB)</div>
        {onSetMode ? <div className={css.menuItem} onClick={handleSensorModeMenuItem}>Sensor Mode</div> : undefined}
        {onSetMode ? <div className={css.menuItem} onClick={handleManualModeMenuItem}>Manual Entry</div> : undefined}
      </div>
    )
  }

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
  }
  const connectionClassName = `${css.connection} ${error ? css.error : (connected ? css.connected : css.disconnected)}`;
  return (
    <div className={css.sensor}>
      <div className={connectionClassName} onClick={connecting || connected ? undefined : handleConnect}>
        {error ? renderError() : (connected ? renderConnected() : (connecting ? renderConnecting() : renderDisconnected()))}
        {renderMenuIcon()}
      </div>
      {renderValues()}
    </div>
  );
};
