import { Sensor, ISensorOptions, ISensorValues, IPollOptions } from "./sensor";

type MockValueDirection = "up" | "down";
interface IStartingSensorValues extends Required<ISensorValues> {
  illuminanceDirection?: MockValueDirection;
  temperatureDirection?: MockValueDirection;
  humidityDirection?: MockValueDirection;
}
type IMockValues = Required<ISensorValues>;
interface IMockValueDirections {
  illuminance: MockValueDirection;
  temperature: MockValueDirection;
  humidity: MockValueDirection;
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
}

export class MockSensor extends Sensor {
  private mockValues: IMockValues;
  private mockValueDirections: IMockValueDirections;
  private minMockValues: Required<ISensorValues>;
  private maxMockValues: Required<ISensorValues>;
  private staticProbability: number;
  private reversalProbability: number;
  private mockedDeviceName: string;

  constructor(options: IMockSensorOptions) {
    super(options);
    this.mockedDeviceName = options.deviceName || "Mocked Sensor";
    this.minMockValues = {
      illuminance: options.minValues?.illuminance || 0,
      temperature: options.minValues?.temperature || -18,
      humidity: options.minValues?.humidity || 0,
    };
    this.maxMockValues = {
      illuminance: options.maxValues?.illuminance || 10000,
      temperature: options.maxValues?.temperature || 38,
      humidity: options.maxValues?.humidity || 90,
    };
    this.mockValues = {
      illuminance: this.randomInRange("illuminance"),
      temperature: this.randomInRange("temperature"),
      humidity: this.randomInRange("humidity"),
      ...options.startingValues,
    };
    this.mockValueDirections = {
      illuminance: options.startingValues?.illuminanceDirection || this.randomDirection({pivot: 0.5}),
      temperature: options.startingValues?.temperatureDirection || this.randomDirection({pivot: 0.5}),
      humidity: options.startingValues?.humidityDirection || this.randomDirection({pivot: 0.5}),
    };
    this.staticProbability = options.staticProbability || 0.5;
    this.reversalProbability = options.reversalProbability || 0.8;
    if (options.autoConnect) {
      this.connect();
    }
  }

  public connect(): Promise<void> {
    this.setConnected({connected: true, deviceName: this.mockedDeviceName});
    return Promise.resolve();
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
    return Promise.resolve(values);
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