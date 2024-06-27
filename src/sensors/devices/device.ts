import { ISensorCapabilities, ISensorValues, SensorCapabilityKey, AllCapabilityKeys } from "../sensor";
import { ITimeSeriesCapabilities } from "../../shared/utils/time-series";

export interface IDeviceOptions {
  name: string;
  deviceName: string;
  serviceUUID: number | string;
  capabilities: ISensorCapabilities;
  requestedCapabilities: ISensorCapabilities;
}

export interface ISelectableSensorInfo {
  name: string;
  internalId: any;
}

export class Device {
  protected _name: string;
  protected _deviceName: string;
  protected _capabilities: ISensorCapabilities;
  protected _requestedCapabilities: ISensorCapabilities;
  protected _serviceUUID: number | string;
  protected _selectableSensors: ISelectableSensorInfo[];

  constructor(options: IDeviceOptions) {
    this._name = options.name;
    this._deviceName = options.deviceName;
    this._capabilities = options.capabilities;
    this._requestedCapabilities = options.capabilities;
    this._serviceUUID = options.serviceUUID;
    this._selectableSensors = [];
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

  public timeSeriesCapabilities(selectableSensorId: any): ITimeSeriesCapabilities|undefined {
    return undefined; // set in each device
  }

  public get selectableSensors(): ISelectableSensorInfo[] {
    return []; // set in each device
  }

  public collectTimeSeries(measurementPeriod: number, selectableSensorId: any, callback: (values: number[]) => void): () => void {
    throw new Error("collectTimeSeries() method not overridden!");
  }

  public matchesCapabilities() {
    let matches = true;
    this.forEachRequestedCapability((capability) => {
      matches = matches && !!this.capabilities[capability];
    });
    return matches;
  }

  public getFilters(): BluetoothRequestDeviceFilter[] {
    return [{services: [this.serviceUUID]}];
  }

  public get serviceUUID() {
    return this._serviceUUID;
  }

  public matchesBluetoothDevice(bluetoothDevice: BluetoothDevice): boolean {
    return !!(bluetoothDevice.name && bluetoothDevice.name.indexOf(this._deviceName) !== -1);
  }

  public get optionalServiceUUIDs(): string[] {
    // optionally overridden in subclasses
    return [];
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer, bluetoothDevice?: BluetoothDevice) {
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