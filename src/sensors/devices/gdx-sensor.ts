import { Device } from "./device";
import godirect from "@vernier/godirect/dist/godirect.min.cjs";
import { ISensorCapabilities, ISensorValues, SensorCapabilityKey } from "../sensor";

const goDirectServiceUUID = "d91714ef-28b9-4f91-ba16-f0d9a604f112";
const measurementPeriod = 100;

// NOTE: to add a new sensor using the existing global capabilities add the prefix to the array
// and update the mapping of the sensor name to the capability below.  More work will be
// required elsewhere in this repo to add new capabilities.  Once the new capability is added
// elsewhere then the map below should be updated.

const goDirectDevicePrefixes = ["GDX-TMP"];
const sensorNameToCapabilityMap: Record<string, Record<string, SensorCapabilityKey>> = {
  "GDX-TMP": {
    "Temperature": "temperature"
  }
};

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

        this.gdxDevice = gdxDevice;
        this.gdxDevice.start(measurementPeriod);

        resolve();
      }).catch(reject);
    });
  }

  public read() {
    const values: ISensorValues = {};
    const enabledSensors = this.gdxDevice.sensors.filter((s: any) => s.enabled);
    const capabilityMap = sensorNameToCapabilityMap[this.gdxDevice.orderCode];
    this.forEachRequestedCapability(capability => {
      enabledSensors.forEach((sensor: any) => {
        if (sensor.value !== null && capabilityMap?.[sensor.name]) {
          values[capabilityMap[sensor.name]] = sensor.value;
        }
      });
    });
    return Promise.resolve(values);
  }

  public teardownRead() {
    this.gdxDevice?.stop();
    return Promise.resolve();
  }
}
