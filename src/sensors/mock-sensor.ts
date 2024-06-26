import { TimeSeriesDataKey, getTimeSeriesMetadata } from "../shared/utils/time-series";
import { ISelectableSensorInfo } from "./devices/device";
import { Sensor, ISensorOptions, ISensorValues, IPollOptions, IConnectOptions } from "./sensor";
import { ITimeSeriesCapabilities } from "../shared/utils/time-series";

type MockValueDirection = "up" | "down";
interface IStartingSensorValues extends Required<ISensorValues> {
  illuminanceDirection?: MockValueDirection;
  temperatureDirection?: MockValueDirection;
  humidityDirection?: MockValueDirection;
  timeSeriesDirection?: MockValueDirection;
}
type IMockValues = Required<ISensorValues>;
interface IMockValueDirections {
  illuminance: MockValueDirection;
  temperature: MockValueDirection;
  humidity: MockValueDirection;
  timeSeries: MockValueDirection;
}
type Measurement = keyof IMockValueDirections;

export interface IMockSensorOptions extends ISensorOptions {
  autoConnect?: boolean;
  deviceName?: string;
  minValues?: ISensorValues;
  maxValues?: ISensorValues;
  startingValues?: IStartingSensorValues;
  staticProbability?: number;
  reversalProbability?: number;
  showDevicePicker?: boolean;
}

export class MockSensor extends Sensor {
  private mockValues: IMockValues;
  private mockValueDirections: IMockValueDirections;
  private minMockValues: Required<ISensorValues>;
  private maxMockValues: Required<ISensorValues>;
  private staticProbability: number;
  private reversalProbability: number;
  private mockedDeviceName: string;
  private showDevicePicker: boolean;

  constructor(options: IMockSensorOptions) {
    super(options);
    this.mockedDeviceName = options.deviceName || "Mocked Sensor";
    this.minMockValues = {
      illuminance: options.minValues?.illuminance || 0,
      temperature: options.minValues?.temperature || -18,
      humidity: options.minValues?.humidity || 0,
      timeSeries: options.minValues?.[TimeSeriesDataKey] || -5,
    };
    this.maxMockValues = {
      illuminance: options.maxValues?.illuminance || 10000,
      temperature: options.maxValues?.temperature || 38,
      humidity: options.maxValues?.humidity || 90,
      timeSeries: options.maxValues?.[TimeSeriesDataKey] || 5,
    };
    this.mockValues = {
      illuminance: this.randomInRange("illuminance"),
      temperature: this.randomInRange("temperature"),
      humidity: this.randomInRange("humidity"),
      timeSeries: this.randomInRange(TimeSeriesDataKey),
      ...options.startingValues,
    };
    this.mockValueDirections = {
      illuminance: options.startingValues?.illuminanceDirection || this.randomDirection({pivot: 0.5}),
      temperature: options.startingValues?.temperatureDirection || this.randomDirection({pivot: 0.5}),
      humidity: options.startingValues?.humidityDirection || this.randomDirection({pivot: 0.5}),
      timeSeries: options.startingValues?.timeSeriesDirection || this.randomDirection({pivot: 0.5}),
    };
    this.staticProbability = options.staticProbability || 0.5;
    this.reversalProbability = options.reversalProbability || 0.8;
    this.showDevicePicker = options.showDevicePicker || false;
    if (options.autoConnect) {
      this.connect();
    }
  }

  public connect(options?: IConnectOptions): Promise<void> {
    this.setConnecting();
    return new Promise((resolve, reject) => {
      if (this.showDevicePicker && options?.onDevicesFound) {
        const devices: IConnectDevice[] = [];
        for (let i = 1; i <= 5; i++) {
          devices.push({
            id: `${i}`,
            name: `Mocked Sensor ${i}`,
            uuids: `uuid${i}`,
            adData: {
              rssi: -30 - Math.floor(Math.random() * 50),
              txPower: i,
              serviceData: {},
              manufacturerData: {}
            }
          });
        }
        options.onDevicesFound({
          devices,
          select: (device) => this.setConnected({connected: true, deviceName: device.name}),
          cancel: () => reject("requestDevice error: select canceled")
        });
      } else {
        setTimeout(() => {
          this.setConnected({connected: true, deviceName: this.mockedDeviceName});
          resolve();
        }, 500);
      }
    });
  }

  public disconnect(): Promise<void> {
    this.setConnected({connected: false});
    return Promise.resolve();
  }

  protected pollValues(options: IPollOptions): Promise<ISensorValues> {
    const values: ISensorValues = {};
    if (this.capabilities.humidity) {
      values.humidity = this.mockValues.humidity;
      this.setNextRandomMockValue({measurement: "humidity", increment: 0.1});
    }
    if (this.capabilities.illuminance) {
      values.illuminance = this.mockValues.illuminance;
      this.setNextRandomMockValue({measurement: "illuminance", increment: 100});
    }
    if (this.capabilities.temperature) {
      values.temperature = this.mockValues.temperature;
      this.setNextRandomMockValue({measurement: "temperature", increment: 0.2});
    }

    values[TimeSeriesDataKey] = this.mockValues[TimeSeriesDataKey];
    this.setNextRandomMockValue({measurement: TimeSeriesDataKey, increment: 0.2});

    return Promise.resolve(values);
  }

  public timeSeriesCapabilities(selectableSensorId: any): ITimeSeriesCapabilities {
    selectableSensorId = parseInt(selectableSensorId ?? "0", 10);
    const {measurement, units, minValue, maxValue} = selectableSensorId === 0
      ? {measurement: "Force", units: "N", minValue: -50, maxValue: 50}
      : {measurement: "Temperature", units: "°C", minValue: -40, maxValue: 125};
    const defaultMeasurementPeriod = 50;
    return {
      measurementPeriod: defaultMeasurementPeriod,
      minMeasurementPeriod: 10,
      defaultMeasurementPeriod,
      measurement,
      valueKey: TimeSeriesDataKey,
      units,
      minValue,
      maxValue,
    };
  }

  public get selectableSensors(): ISelectableSensorInfo[] {
    return [
      {name: "Mocked Sensor: Force", internalId: 0},
      {name: "Mocked Sensor: Temperature", internalId: 1},
    ];
  }

  public collectTimeSeries(measurementPeriod: number, selectableSensorId: any, callback: (values: number[]) => void): () => void {
    const values: number[] = [];

    const callCallback = () => {
      const value = this.mockValues[TimeSeriesDataKey];
      this.setNextRandomMockValue({measurement: TimeSeriesDataKey, increment: 0.5});
      values.push(value);
      callback(values);
    };

    callCallback();

    const interval = setInterval(() => {
      callCallback();
    }, measurementPeriod);

    return () => {
      clearInterval(interval);
    };
  }

  private minMax(measurement: Measurement) {
    const min = this.minMockValues[measurement];
    const max = this.maxMockValues[measurement];
    return {min, max};
  }

  private randomInRange(measurement: Measurement) {
    const {min, max} = this.minMax(measurement);
    return min + ((max - min) * Math.random());
  }

  private randomDirection(options: {pivot: number, currentDirection?: MockValueDirection}) {
    const {pivot} = options;
    const currentDirection = options.currentDirection || "up";
    return Math.random() < pivot ? currentDirection : (currentDirection === "up" ? "down" : "up");
  }

  private setNextRandomMockValue(options: {measurement: Measurement, increment: number}) {
    // see if the value should change
    if (Math.random() > this.staticProbability) {
      const {measurement, increment} = options;
      const {min, max} = this.minMax(measurement);

      // see if the direction should change
      let nextDirection = this.mockValueDirections[measurement];
      nextDirection = this.randomDirection({pivot: this.reversalProbability, currentDirection: nextDirection});

      const delta = nextDirection === "up" ? 1 : -1;
      const offset = Math.random() * increment * delta;
      this.mockValues[measurement] = Math.max(min, Math.min(max, this.mockValues[measurement] + offset));
      this.mockValueDirections[measurement] = nextDirection;
    }
  }
}
