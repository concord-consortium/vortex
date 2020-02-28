import React from "react";
import { SensorValue } from "./sensor-value";
import { Sensor } from "../../sensors/sensor";
import { useSensor } from "../hooks/use-sensor";
import { MenuComponent, MenuItemComponent } from "../../shared/components/menu";
import css from "./sensor.module.scss";

interface IProps {
  sensor: Sensor;
  hideMenu?: boolean;
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

export const SensorComponent: React.FC<IProps> = ({sensor, hideMenu}) => {
  const {connected, connecting, deviceName, values, error} = useSensor(sensor);

  const connect = () => sensor.connect();
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
    return (
      <MenuComponent>
        {connected
          ? <MenuItemComponent onClick={disconnect}>Disconnect</MenuItemComponent>
          : <MenuItemComponent onClick={connect}>Connect</MenuItemComponent>
        }
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
      <div className={connectionClassName} onClick={connecting || connected ? undefined : connect}>
        {error ? renderError() : (connected ? renderConnected() : (connecting ? renderConnecting() : renderDisconnected()))}
        {!hideMenu && renderMenu()}
      </div>
      {renderValues()}
    </div>
  );
};

