import { Device } from "./device";
import { ISensorCapabilities } from "../sensor";

export class MultiSensorDevice extends Device {

  constructor(requestedCapabilities: ISensorCapabilities) {
    super({
      name: "Multi-Sensor",
      serviceUUID: 0xdeadbeef, // TODO
      capabilities: {
        illuminance: true,
        temperature: true,
        humidity: true,
      },
      requestedCapabilities
    })
  }

  /* TDB */
}