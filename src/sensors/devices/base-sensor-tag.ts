import { Device, IDeviceOptions } from "./device";
import { ISensorCapabilities, ISensorValues, AllCapabilityKeys } from "../sensor";

interface ISensorConfig {
  service: string;
  data: string;
  characteristic: string;
  convert: (dataView: DataView) => number;
}

interface IBaseSensorConfig {
  [key: string]: ISensorConfig;
}

interface IDataCharacteristics {
  illuminance: BluetoothRemoteGATTCharacteristic | undefined;
  temperature: BluetoothRemoteGATTCharacteristic | undefined;
  humidity: BluetoothRemoteGATTCharacteristic | undefined;
}

export interface IBaseSensorTagDeviceOptions extends IDeviceOptions {
  config: IBaseSensorConfig;
}

export class BaseSensorTagDevice extends Device {
  private config: IBaseSensorConfig;
  private dataCharacteristics: IDataCharacteristics = {
    illuminance: undefined,
    temperature: undefined,
    humidity: undefined,
  };

  constructor(options: IBaseSensorTagDeviceOptions) {
    super(options);
    this.config = options.config;
  }

  public get optionalServiceUUIDs() {
    return this.mapRequestedCapabilities<string>(capability => this.config[capability].service);
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer) {
    let promise = Promise.resolve();
    this.forEachRequestedCapability(capability => {
      promise = promise
        .then(() => this.setupSensor(bluetoothServer, this.config[capability]))
        .then((dataCharacteristic) => {
          this.dataCharacteristics[capability] = dataCharacteristic;
          return;
        });
    });
    return promise;
  }

  public read() {
    const values: ISensorValues = {};
    let promise = Promise.resolve();
    this.forEachRequestedCapability(capability => {
      const dataCharacteristic = this.dataCharacteristics[capability];
      if (dataCharacteristic) {
        promise = promise
          .then(() => dataCharacteristic.readValue())
          .then(dataView => {
            values[capability] = this.config[capability].convert(dataView);
            return;
          });
      } else {
        promise = promise.then(() => Promise.reject(`No data characteristic for ${capability}`));
      }
    });
    return promise.then(() => values);
  }

  public teardownRead() {
    this.forEachRequestedCapability(capability => this.dataCharacteristics[capability] = undefined);
    return Promise.resolve();
  }

  private setupSensor(bluetoothServer: BluetoothRemoteGATTServer, sensorConfig: ISensorConfig) {
    return new Promise<BluetoothRemoteGATTCharacteristic>((resolve, reject) => {
      return bluetoothServer
        .getPrimaryService(sensorConfig.service)
        .then(service => service.getCharacteristic(sensorConfig.characteristic).then(characteristic => ({service, characteristic})))
        .then(({service, characteristic}) => characteristic.writeValue(new Uint8Array([0x01])).then(() => service))
        // tested this to fix android chrome error, but it didn't work
        // .then(service => delayPromise(100, service))
        .then(service => service.getCharacteristic(sensorConfig.data))
        .then(resolve)
        .catch(reject);
    });
  }
}
