import { Device } from "./device";
import godirect from "@vernier/godirect/dist/godirect.min.cjs";
import { ISensorCapabilities, ISensorValues, ITimeSeriesCapabilities } from "../sensor";
import { IDataTableTimeData } from "../../shared/components/data-table-field";

const goDirectServiceUUID = "d91714ef-28b9-4f91-ba16-f0d9a604f112";

// NOTE: to add a new sensor using the existing global capabilities add the prefix to the array
// and update the mapping of the sensor name to the capability below.  More work will be
// required elsewhere in this repo to add new capabilities.  Once the new capability is added
// elsewhere then the map below should be updated.

const goDirectDevicePrefixes = ["GDX-TMP"];

export class GDXSensorDevice extends Device {
  private gdxDevice: any;
  private _timeSeriesCapabilities: ITimeSeriesCapabilities|undefined = undefined;

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

  public get timeSeriesCapabilities(): ITimeSeriesCapabilities|undefined {
    return this._timeSeriesCapabilities;
  }

  public collectTimeSeries(measurementPeriod: number, callback: (values: IDataTableTimeData[]) => void): () => void {
    const sensor = this.gdxDevice?.sensors.find((s: any) => s.enabled);

    if (!this.gdxDevice || !sensor || !this.timeSeriesCapabilities) {
      return () => {
        // noop
      };
    }

    let time = 0;
    const delta = measurementPeriod / 1000;
    const values: IDataTableTimeData[] = [];
    const capabilities = {...this.timeSeriesCapabilities, measurementPeriod};

    const handleChange = () => {
      if (values.length === 0) {
        values.push({time, value: sensor.value, capabilities});
      } else {
        values.push({time, value: sensor.value});
      }
      callback(values);
      time += delta;
    };
    sensor.on("value-changed", handleChange);
    this.gdxDevice.start(measurementPeriod);

    return () => {
      sensor.off("value-changed", handleChange);
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

        let defaultMeasurementPeriod = 50;
        const firstSensor = gdxDevice?.sensors[0];
        if (firstSensor) {
          const measurementInfo = firstSensor.specs?.measurementInfo;
          const measurement: string = firstSensor.name;
          const valueKey = measurement.toLowerCase();
          const minMeasurementPeriod = gdxDevice.minMeasurementPeriod;
          defaultMeasurementPeriod = Math.max(minMeasurementPeriod, defaultMeasurementPeriod);
          this._timeSeriesCapabilities = {
            measurementPeriod: defaultMeasurementPeriod,
            minMeasurementPeriod,
            defaultMeasurementPeriod,
            measurement,
            valueKey,
            units: firstSensor.unit,
            minValue: measurementInfo.minValue ?? 0,
            maxValue: measurementInfo.maxValue ?? 0
          };
        } else {
          this._timeSeriesCapabilities = undefined;
        }

        this.gdxDevice = gdxDevice;
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
