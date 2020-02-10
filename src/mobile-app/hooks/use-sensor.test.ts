import { Sensor, ISensorValues, SensorEvent, ISensorConnectionEventData, ISensorValuesEventData, ISensorErrorData } from "../../sensors/sensor";
import { renderHook, act } from "@testing-library/react-hooks";
import { MockSensor } from "../../sensors/mock-sensor";
import { useSensor } from "./use-sensor";

describe("use-sensor hook", () => {
  let sensor: MockSensor;
  let autoConnectedSensor: MockSensor;

  beforeEach(() => {
    sensor = new MockSensor({
      deviceName: "Sensor",
      capabilities: {
        illuminance: true,
        temperature: true,
        humidity: true
      }
    });
    autoConnectedSensor = new MockSensor({
      autoConnect: true,
      deviceName: "Auto-Connected Sensor",
      capabilities: {
        illuminance: true,
        temperature: true,
        humidity: true
      }
    });
  });

  it("handles no sensor", async () => {
    const { result } = renderHook(() => useSensor(null));
    expect(result.current.connected).toEqual(false);
    expect(result.current.values).toEqual({});
    expect(result.current.error).toEqual(undefined);
  });

  it("normal sensors start disconnected and then can connect and disconnect", async () => {
    const { result } = renderHook(() => useSensor(sensor));
    expect(result.current.connected).toEqual(false);
    expect(result.current.values).toEqual({});
    expect(result.current.error).toEqual(undefined);

    // before connect it has no device name
    expect(result.current.deviceName).toEqual(undefined);
    await act(async () => { await sensor.connect(); });
    // after connect it is the assigned device name
    expect(result.current.deviceName).toEqual("Sensor");
    await act(async () => { await sensor.disconnect(); });
    // after disconnect it has no device name
    expect(result.current.deviceName).toEqual(undefined);
  });

  it("autoconnect sensors start connected with values", async () => {
    const { result } = renderHook(() => useSensor(autoConnectedSensor));
    expect(result.current.connected).toEqual(true);
    expect(result.current.values).not.toEqual({});
    expect(result.current.error).toEqual(undefined);
    expect(result.current.deviceName).toEqual("Auto-Connected Sensor");
  });

  it("sensors can be assigned error values", async () => {
    const { result } = renderHook(() => useSensor(sensor));
    expect(result.current.error).toEqual(undefined);
    act(() => sensor.setError(new Error("Test Error")));
    expect(result.current.error.toString()).toEqual("Error: Test Error");
  });

});
