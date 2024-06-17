import { Sensor, ISensorValues, ISensorOptions, ISensorCapabilities, ISetConnectedOptions, IPollOptions, IConnectOptions, ITimeSeriesCapabilities } from "./sensor";

import { Device } from "./devices/device";
import { SensorTag2Device } from "./devices/sensor-tag-cc2650";
import { SensorTagCC1350Device } from "./devices/sensor-tag-cc1350";
import { MultiSensorDevice } from "./devices/multi-sensor";
import { GDXSensorDevice } from "./devices/gdx-sensor";
import { logInfo } from "../shared/utils/log";
import { inCordova } from "../shared/utils/in-cordova";
import { IDataTableTimeData } from "../shared/components/data-table-field";

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
    const allDevices = [
      new SensorTag2Device(options.capabilities),
      new SensorTagCC1350Device(options.capabilities),
      new MultiSensorDevice(options.capabilities),
      new GDXSensorDevice(options.capabilities)
    ];
    // experiments can set filters explicity and not just by capabilities
    this.devices = this.experimentFilters.length > 0
      ? allDevices
      : allDevices.filter(device => device.matchesCapabilities());
  }

  public connect(connectOptions: IConnectOptions): Promise<void> {
    // make sure we aren't already connected to something
    if (this.device) {
      this.setConnected({connected: false});
    }
    this.setConnecting();
    return new Promise<void>((resolve, reject) => {
      if (!navigator.bluetooth) {
        return reject("Bluetooth not enabled in this environment");
      }
      const options: RequestDeviceOptions =
        inCordova ? {
          filters: this.getFilters(),
          optionalServices: this.getOptionalServiceUUIDs(),
          // the following are extensions to the cordova-plugin-webbluetooth plugin to enable a sensor list
          onDevicesFound: connectOptions.onDevicesFound, // callback when a new device is found
          scanTime: -1, // scan forever
          deviceTimeout: 5000 // drop devices from list after 5 seconds of not hearing from them
        } : {
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

  public get timeSeriesCapabilities() {
    return this.device?.timeSeriesCapabilities;
  }

  protected pollValues(options: IPollOptions): Promise<ISensorValues> {
    return new Promise<ISensorValues>((resolve, reject) => {
      const {device, bluetoothDevice, bluetoothServer} = this;
      if (!device) {
        return reject("No device found");
      }
      if (!bluetoothServer) {
        return reject("No bluetoothServer found");
      }
      if (options.firstPoll) {
        return device.setupRead(bluetoothServer, bluetoothDevice).then(() => device.read()).then(resolve).catch(reject);
      } else if (options.lastPoll) {
        return device.teardownRead().then(() => {
          this.device = undefined;
          resolve({});
        }).catch(reject);
      } else {
        return device.read().then(resolve).catch(reject);
      }
    });
  }

  public collectTimeSeries(measurementPeriod: number, callback: (values: IDataTableTimeData[]) => void): () => void {
    if (this.device) {
      return this.device.collectTimeSeries(measurementPeriod, callback);
    }
    return () => {
      // noop
    };
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
    // experiments can set filters explicity and not just by capabilities
    if (this.experimentFilters.length > 0) {
      return this.experimentFilters;
    }

    let filters: BluetoothRequestDeviceFilter[] = [];
    this.devices.forEach(device => {
      filters = filters.concat(device.getFilters());
    });
    return filters;
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
