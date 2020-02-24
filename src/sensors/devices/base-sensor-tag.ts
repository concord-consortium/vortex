import { Device, IDeviceOptions } from "./device";
import { ISensorCapabilities, ISensorValues, AllCapabilityKeys } from "../sensor";

interface IBaseSensorConfig {
  [key: string]: {
    service: string;
    data: string;
    characteristic: string;
    convert: (dataView: DataView) => number;
  };
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

  public matchesBluetoothDevice(bluetoothDevice: BluetoothDevice) {
    return !!(bluetoothDevice.name && bluetoothDevice.name.indexOf("SensorTag") !== -1);
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer) {
    return new Promise<void>((resolve, reject) => {
      const promises: Promise<BluetoothRemoteGATTCharacteristic>[] = [];
      this.forEachRequestedCapability(capability => {
        const promise = this.setupSensor(bluetoothServer, this.config[capability])
          .then((dataCharacteristic) => this.dataCharacteristics[capability] = dataCharacteristic);
        promises.push(promise);
      });
      // tested this to fix android chrome error, but it didn't work
      // return serializePromises(promises).then(() => resolve()).catch(reject);
      return Promise.all(promises).then(() => resolve()).catch(reject);
    });
  }

  public read() {
    return new Promise<ISensorValues>((resolve, reject) => {
      const promises: Promise<number>[] = [];
      const values: ISensorValues = {};
      this.forEachRequestedCapability(capability => {
        const dataCharacteristic = this.dataCharacteristics[capability];
        if (dataCharacteristic) {
          const promise = dataCharacteristic.readValue()
            .then(dataView => values[capability] = this.config[capability].convert(dataView));
          promises.push(promise);
        } else {
          promises.push(Promise.reject(`No data characteristic for ${capability}`));
        }
      });
      // tested this to fix android chrome error, but it didn't work
      // return serializePromises(promises).then(() => resolve(values)).catch(reject);
      return Promise.all(promises).then(() => resolve(values)).catch(reject);
    });
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