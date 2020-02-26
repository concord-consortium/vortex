import { ISensorCapabilities } from "../sensor";
import { BaseSensorTagDevice } from "./base-sensor-tag";

// http://processors.wiki.ti.com/index.php/CC2650_SensorTag_User%27s_Guide
const IR_SCALE_LSB = 0.03125;

export class SensorTag2Device extends BaseSensorTagDevice {

  constructor(requestedCapabilities: ISensorCapabilities) {
    super({
      name: "Sensor Tag CC2650",
      deviceName: "CC2650 SensorTag",
      serviceUUID: 0xaa80,
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
      }
    });
  }
}