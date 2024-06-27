import { Device, ISelectableSensorInfo } from "./device";
import godirect from "@vernier/godirect/dist/godirect.min.cjs";
import { ISensorCapabilities, ISensorValues } from "../sensor";
import { ITimeSeriesCapabilities } from "../../shared/utils/time-series";

const goDirectServiceUUID = "d91714ef-28b9-4f91-ba16-f0d9a604f112";

// NOTE: to add a new sensor using the existing global capabilities add the prefix to the array
// and update the mapping of the sensor name to the capability below.  More work will be
// required elsewhere in this repo to add new capabilities.  Once the new capability is added
// elsewhere then the map below should be updated.

const goDirectDevicePrefixes = ["GDX-TMP"];

export class GDXSensorDevice extends Device {
  private gdxDevice: any;

  constructor(requestedCapabilities: ISensorCapabilities) {
    super({
      name: "GDX-Sensor",
      deviceName: "GDX-Sensor",
      serviceUUID: "",
      capabilities: {
        illuminance: false,
        temperature: true,
        humidity: false,
      },
      requestedCapabilities,
    });
  }

  public getFilters() {
    // we only filter by name prefix and not capabilities as the Vernier sensors don't publish their capabilities
    return goDirectDevicePrefixes.map(namePrefix => ({namePrefix}));
  }

  public get optionalServiceUUIDs() {
    return [goDirectServiceUUID];
  }

  public timeSeriesCapabilities(selectableSensorId: any): ITimeSeriesCapabilities|undefined {
    if (!this.gdxDevice) {
      return;
    }

    selectableSensorId = Number(selectableSensorId ?? this.gdxDevice.sensors[0].number);
    const selectedSensor = this.gdxDevice?.sensors.find((s: any) => s.number === selectableSensorId);

    if (!selectedSensor) {
      return undefined;
    }

    let defaultMeasurementPeriod = 50;
    const measurementInfo = selectedSensor.specs?.measurementInfo;
    const measurement: string = selectedSensor.name;
    const valueKey = measurement.toLowerCase();
    const minMeasurementPeriod = this.gdxDevice.minMeasurementPeriod;
    defaultMeasurementPeriod = Math.max(minMeasurementPeriod, defaultMeasurementPeriod);
    return {
      measurementPeriod: defaultMeasurementPeriod,
      minMeasurementPeriod,
      defaultMeasurementPeriod,
      measurement,
      valueKey,
      units: selectedSensor.unit,
      minValue: measurementInfo.minValue ?? 0,
      maxValue: measurementInfo.maxValue ?? 0
    };
  }

  public get selectableSensors(): ISelectableSensorInfo[] {
    if (!this.gdxDevice) {
      return [];
    }

    return this.gdxDevice.sensors.map((s: any) => ({name: s.name, internalId: s.number}));
  }

  public collectTimeSeries(measurementPeriod: number, selectableSensorId: any, callback: (values: number[]) => void): () => void {
    if (!this.gdxDevice) {
      return () => {
        // noop
      };
    }

    selectableSensorId = Number(selectableSensorId ?? this.gdxDevice.sensors[0].number);

    let time = 0;
    const delta = measurementPeriod / 1000;
    const values: number[] = [];

    const handleChange = (sensor: any) => {
      if (sensor.number === selectableSensorId) {
        values.push(sensor.value);
        callback(values);
        time += delta;
      }
    };
    this.gdxDevice.sensors.forEach((sensor: any) => {
      if (sensor.number === selectableSensorId) {
        sensor.on("value-changed", handleChange);
      }
    });

    this.gdxDevice.start(measurementPeriod);

    return () => {
      this.gdxDevice?.sensors.forEach((sensor: any) => {
        sensor.off("value-changed", handleChange);
      });
    };
  }

  public matchesBluetoothDevice(bluetoothDevice: BluetoothDevice): boolean {
    const name = bluetoothDevice.name ?? "";
    return name.startsWith("GDX-");
  }

  public setupRead(bluetoothServer: BluetoothRemoteGATTServer, bluetoothDevice: BluetoothDevice) {
    return new Promise<void>((resolve, reject) => {
      if (this.gdxDevice) {
        this.gdxDevice.stop();
        this.gdxDevice = null;
      }

      godirect.createDevice(bluetoothDevice, { open: true, startMeasurements: false }).then((gdxDevice: any) => {
        if (!gdxDevice) {
          if (bluetoothDevice.gatt?.connected) {
            bluetoothDevice.gatt?.disconnect();
          }
          reject("Unable to create GDX device");
          return;
        }

        const defaultMeasurementPeriod = this.timeSeriesCapabilities(gdxDevice.sensors[0].number);

        this.gdxDevice = gdxDevice;
        this.gdxDevice.sensors.forEach((sensor: any) => {
          sensor?.setEnabled(true);
        });
        this.gdxDevice.start(defaultMeasurementPeriod);

        resolve();
      }).catch(reject);
    });
  }

  public read() {
    const values: ISensorValues = {};
    const enabledSensors = this.gdxDevice.sensors.filter((s: any) => s.enabled);
    enabledSensors.forEach((sensor: {name: string|null, value: number|null}) => {
      if (sensor.value !== null && sensor.name !== null) {
        const key = sensor.name.toLowerCase() as keyof ISensorValues;
        values[key] = sensor.value;
      }
    });
    return Promise.resolve(values);
  }

  public teardownRead() {
    this.gdxDevice?.stop();
    return Promise.resolve();
  }
}
