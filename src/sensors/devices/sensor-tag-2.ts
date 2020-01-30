import { Device } from "./device";
import { ISensorCapabilities, ISensorValues, AllCapabilityKeys } from "../sensor";

interface ISensorConfig {
  service: string;
  data: string;
  characteristic: string;
  convert: (dataView: DataView) => number;
}

// http://processors.wiki.ti.com/index.php/CC2650_SensorTag_User%27s_Guide
const IR_SCALE_LSB = 0.03125;

const config: {[key: string]: ISensorConfig} = {
  illuminance: {
    service: "f000aa70-0451-4000-b000-000000000000",
    data: "f000aa71-0451-4000-b000-000000000000",
    characteristic: "f000aa72-0451-4000-b000-000000000000",
    convert: (dataView:DataView) => {
      const rawData = dataView.getUint16(0, true);
      const m = rawData & 0x0FFF;
      let e = (rawData & 0xF000) >> 12;
      /** e on 4 bits stored in a 16 bit unsigned => it can store 2 << (e - 1) with e < 16 */
      e = (e === 0) ? 1 : 2 << (e - 1);
      return m * (0.01 * e);
    }
  },
  humidity: {
    service: "f000aa20-0451-4000-b000-000000000000",
    data: "f000aa21-0451-4000-b000-000000000000", // TempLSB:TempMSB:HumidityLSB:HumidityMSB
    characteristic: "f000aa22-0451-4000-b000-000000000000",
    convert: (dataView: DataView) => {
      let rawHum = dataView.getUint16(2, true);
      rawHum &= ~0x0003; // remove status bits
      return (rawHum / 65536) * 100;
    }
  },
  temperature: {
    service: "f000aa00-0451-4000-b000-000000000000",
    data: "f000aa01-0451-4000-b000-000000000000", // ObjectLSB:ObjectMSB:AmbientLSB:AmbientMSB
    characteristic: "f000aa02-0451-4000-b000-000000000000",
    convert: (dataView: DataView) => {
      const rawTemp = dataView.getUint16(2, true);
      return (rawTemp >> 2) * IR_SCALE_LSB;
    }
  }
};

interface IDataCharacteristics {
  illuminance: BluetoothRemoteGATTCharacteristic | undefined;
  temperature: BluetoothRemoteGATTCharacteristic | undefined
  humidity: BluetoothRemoteGATTCharacteristic | undefined
}

export class SensorTag2Device extends Device {
  private dataCharacteristics: IDataCharacteristics = {
    illuminance: undefined,
    temperature: undefined,
    humidity: undefined,
  }

  constructor(requestedCapabilities: ISensorCapabilities) {
    super({
      name: "Sensor Tag 2.0",
      serviceUUID: 0xaa80,
      capabilities: {
        illuminance: true,
        temperature: true,
        humidity: true,
      },
      requestedCapabilities
    })
  }

  public get optionalServiceUUIDs() {
    return this.mapRequestedCapabilities<string>(capability => config[capability].service);
  }

  public matchesBluetoothDevice(bluetoothDevice: BluetoothDevice) {
    return !!(bluetoothDevice.name && bluetoothDevice.name.indexOf("SensorTag") !== -1);
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer) {
    return new Promise<void>((resolve, reject) => {
      const promises: Promise<BluetoothRemoteGATTCharacteristic>[] = [];
      this.forEachRequestedCapability(capability => {
        const promise = this.setupSensor(bluetoothServer, config[capability])
          .then((dataCharacteristic) => this.dataCharacteristics[capability] = dataCharacteristic)
        promises.push(promise);
      });
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
            .then(dataView => values[capability] = config[capability].convert(dataView))
          promises.push(promise);
        } else {
          promises.push(Promise.reject(`No data characteristic for ${capability}`))
        }
      });
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
        .then(service => service.getCharacteristic(sensorConfig.data))
        .then(resolve)
        .catch(reject);
    });
  }
}