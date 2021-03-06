import { ISensorCapabilities } from "../sensor";
import { BaseSensorTagDevice } from "./base-sensor-tag";

export class MultiSensorDevice extends BaseSensorTagDevice {

  constructor(requestedCapabilities: ISensorCapabilities) {
    super({
      name: "Multi-Sensor",
      deviceName: "Multi-Sensor",
      serviceUUID: "f0001110-0451-4000-b000-000000000000",
      capabilities: {
        illuminance: true,
        temperature: true,
        humidity: true,
      },
      requestedCapabilities,
      config: {
        illuminance: {
          service: "f000aa70-0451-4000-b000-000000000000",
          data: "f000aa71-0451-4000-b000-000000000000",
          characteristic: "f000aa72-0451-4000-b000-000000000000",
          convert: (dataView:DataView) => dataView.getFloat32(0, true)
        },
        humidity: {
          service: "f000aa20-0451-4000-b000-000000000000",
          data: "f000aa21-0451-4000-b000-000000000000", // TempLSB:TempMSB:HumidityLSB:HumidityMSB
          characteristic: "f000aa22-0451-4000-b000-000000000000",
          convert: (dataView: DataView) => dataView.getFloat32(0, true)
        },
        temperature: {
          service: "f000aa00-0451-4000-b000-000000000000",
          data: "f000aa01-0451-4000-b000-000000000000", // ObjectLSB:ObjectMSB:AmbientLSB:AmbientMSB
          characteristic: "f000aa02-0451-4000-b000-000000000000",
          convert: (dataView: DataView) => dataView.getFloat32(0, true)
        }
      }
    });
  }
}
