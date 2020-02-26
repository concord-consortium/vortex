import { ISensorCapabilities, ISensorValues, SensorCapabilityKey, AllCapabilityKeys } from "../sensor";

export interface IDeviceOptions {
  name: string;
  deviceName: string;
  filters: any;
  capabilities: ISensorCapabilities;
  requestedCapabilities: ISensorCapabilities;
}

export class Device {
  protected _name: string;
  protected _deviceName: string;
  protected _capabilities: ISensorCapabilities;
  protected _requestedCapabilities: ISensorCapabilities;
  protected _filters: any;

  constructor(options: IDeviceOptions) {
    this._name = options.name;
    this._deviceName = options.deviceName;
    this._capabilities = options.capabilities;
    this._requestedCapabilities = options.capabilities;
    this._filters = options.filters;
  }

  public get name() {
    return this._name;
  }

  public get capabilities() {
    return this._capabilities;
  }

  public get requestedCapabilities() {
    return this._requestedCapabilities;
  }

  public matchesCapabilities() {
    let matches = true;
    this.forEachRequestedCapability((capability) => {
      matches = matches && !!this.capabilities[capability];
    });
    return matches;
  }

  public get filters() {
    return this._filters;
  }

  public matchesBluetoothDevice(bluetoothDevice: BluetoothDevice): boolean {
    return !!(bluetoothDevice.name && bluetoothDevice.name.indexOf(this._deviceName) !== -1);
  }

  public get optionalServiceUUIDs(): string[] {
    // optionally overridden in subclasses
    return [];
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer) {
    // required to be overridden in subclasses
    return new Promise<void>((resolve, reject) => {
      reject("setupRead() not overridden");
    });
  }

  public read() {
    // required to be overridden in subclasses
    return new Promise<ISensorValues>((resolve, reject) => {
      reject("read() not overridden");
    });
  }

  public teardownRead() {
    // required to be overridden in subclasses
    return new Promise<void>((resolve, reject) => {
      reject("teardownRead() not overridden");
    });
  }

  protected forEachRequestedCapability(callback: (key: SensorCapabilityKey) => void) {
    AllCapabilityKeys.forEach(capability => {
      if (this.requestedCapabilities[capability]) {
        callback(capability);
      }
    });
  }

  protected mapRequestedCapabilities<T>(callback: (key: SensorCapabilityKey) => any) {
    const capabilities: SensorCapabilityKey[] = [];
    this.forEachRequestedCapability(capability => capabilities.push(capability));
    return capabilities.map<T>(callback);
  }
}
