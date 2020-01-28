import React, { useState } from "react";
import { SensorValue } from "./sensor-value";
import { Sensor } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";

import css from "./sensor.module.scss";

interface IProps {
  sensor: Sensor;
}

export const SensorComponent: React.FC<IProps> = ({sensor}) => {
  const {connected, deviceName, values} = useSensor(sensor);
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = () => sensor.connect();
  const handleMenuIcon = () => setShowMenu(!showMenu);
  const handleMenuItem = (handler: () => void) => {
    handler();
    setShowMenu(false);
  }
  const handleConnectMenuItem = () => handleMenuItem(() => sensor.connect());
  const handleDisconnectMenuItem = () => handleMenuItem(() => sensor.disconnect());

  const renderDisconnected = () => {
    return (
      <div className={css.connectionLabel} onClick={handleConnect}>
        <div className={css.disconnectedIcon} />
        No Sensor Connected
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
        <div className={css.menuItem}>Reset All (TBD)</div>
        {connected
          ? <div className={css.menuItem} onClick={handleDisconnectMenuItem}>Disconnect</div>
          : <div className={css.menuItem} onClick={handleConnectMenuItem}>Connect</div>
        }
        <div className={css.menuItem}>Show Plots (TDB)</div>
        <div className={css.menuItem}>Sensor Mode (TDB)</div>
        <div className={css.menuItem}>Manual Entry (TDB)</div>
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
  const connectionClassName = `${css.connection} ${connected ? css.connected : css.disconnected}`;
  return (
    <div className={css.sensor}>
      <div className={connectionClassName}>
        {connected ? renderConnected() : renderDisconnected()}
        {renderMenuIcon()}
      </div>
      {renderValues()}
    </div>
  );
};
