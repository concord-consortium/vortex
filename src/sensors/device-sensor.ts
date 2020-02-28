import { Sensor, ISensorValues, ISensorOptions, ISensorCapabilities, ISetConnectedOptions, IPollOptions } from "./sensor";

import { Device } from "./devices/device";
import { SensorTag2Device } from "./devices/sensor-tag-cc2650";
import { SensorTagCC1350Device } from "./devices/sensor-tag-cc1350";
import { MultiSensorDevice } from "./devices/multi-sensor";
import { logInfo } from "../shared/utils/log";

declare global {
  // tslint:disable-next-line:interface-name
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

export class DeviceSensor extends Sensor {
  private devices: Device[];
  private device: Device | undefined;
  private bluetoothDevice: BluetoothDevice | undefined;
  private bluetoothServer: BluetoothRemoteGATTServer | undefined;

  constructor(options: ISensorOptions) {
    super(options);
    this.devices = [
      new SensorTag2Device(options.capabilities),
      new SensorTagCC1350Device(options.capabilities),
      new MultiSensorDevice(options.capabilities)
    ].filter(device => device.matchesCapabilities());
  }

  public connect(): Promise<void> {
    // make sure we aren't already connected to something
    if (this.device) {
      this.setConnected({connected: false});
    }
    this.setConnecting();
    return new Promise<void>((resolve, reject) => {
      if (!navigator.bluetooth) {
        return reject("Bluetooth not enabled in this environment");
      }
      const options: RequestDeviceOptions = {
        filters: this.getFilters(),
        optionalServices: this.getOptionalServiceUUIDs()
      };
      logInfo("Connecting using", options);
      navigator.bluetooth.requestDevice(options)
        .then(bluetoothDevice => {
          bluetoothDevice.addEventListener("gattserverdisconnected", this.handleDisconnected);
          this.bluetoothDevice = bluetoothDevice;

          this.device = this.devices.find(device => device.matchesBluetoothDevice(bluetoothDevice));
          if (!this.device) {
            throw new Error("No matching device found for bluetooth device");
          }
          if (!bluetoothDevice.gatt) {
            throw new Error("No gatt found for device");
          }
          return bluetoothDevice.gatt.connect();
        })
        .then(server => {
          this.bluetoothServer = server;
          this.setConnected({
            connected: true,
            deviceName: this.bluetoothDevice?.name || "Unnamed Device"
          });
          resolve();
        })
        .catch((err) => {
          this.setConnected({connected: false});
          reject(err);
        });
    });
  }

  public disconnect(): Promise<void> {
    this.setConnected({connected: false});
    return Promise.resolve();
  }

  protected pollValues(options: IPollOptions): Promise<ISensorValues> {
    return new Promise<ISensorValues>((resolve, reject) => {
      const {device, bluetoothServer} = this;
      if (!device) {
        return reject("No device found");
      }
      if (!bluetoothServer) {
        return reject("No bluetoothServer found");
      }
      if (options.firstPoll) {
        return device.setupRead(bluetoothServer).then(() => device.read()).then(resolve).catch(reject);
      } else if (options.lastPoll) {
        return device.teardownRead().then(() => resolve({})).catch(reject);
      } else {
        return device.read().then(resolve).catch(reject);
      }
    });
  }

  protected setConnected(options: ISetConnectedOptions) {
    super.setConnected(options);
    if (!options.connected) {
      this.bluetoothDevice?.removeEventListener("gattserverdisconnected", this.handleDisconnected);
      this.bluetoothDevice?.gatt?.disconnect();
      this.device = undefined;
      this.bluetoothDevice = undefined;
      this.bluetoothServer = undefined;
    }
  }

  private handleDisconnected = () => {
    this.setConnected({connected: false});
  }

  private getFilters() {
    return this.devices.map(device => {
      return {services: [device.serviceUUID]};
    });
  }

  private getOptionalServiceUUIDs() {
    let uuids: string[] = [];
    this.devices.forEach(device => {
      uuids = uuids.concat(device.optionalServiceUUIDs);
    });
    // get unique uuids
    uuids = uuids.filter((uuid, i) => uuids.indexOf(uuid) === i);
    return uuids;
  }
}
