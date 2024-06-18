import EventEmitter from "eventemitter3";
import { IDataTableTimeData } from "../shared/components/data-table-field";

export interface ISensorCapabilities {
  illuminance?: boolean;
  temperature?: boolean;
  humidity?: boolean;
}
export type SensorCapabilityKey = keyof ISensorCapabilities;
export const AllCapabilityKeys: SensorCapabilityKey[] = ["illuminance", "temperature", "humidity"];

export interface ISensorValues {
  illuminance?: number;
  temperature?: number;
  humidity?: number;
  timeSeries?: number;
}

export interface ISensorOptions {
  capabilities: ISensorCapabilities;
  experimentFilters: BluetoothRequestDeviceFilter[];
  pollInterval?: number;
}

export const AllCapabilities: ISensorCapabilities = {
  illuminance: true,
  temperature: true,
  humidity: true,
};

export enum SensorEvent {
  Connecting = "connecting",
  Connection = "connection",
  Disconnected = "disconnected",
  Values = "values",
  Error = "error",
}

export interface ISensorConnectionEventData {
  connected: boolean;
  deviceName?: string;
}
export interface ISensorValuesEventData {
  deviceName?: string;
  values: ISensorValues;
}

export interface ISensorErrorData {
  deviceName?: string;
  error: any;
}

export interface ISetConnectedOptions {
  connected: boolean;
  deviceName?: string;
}

export interface IPollOptions {
  firstPoll?: boolean;
  lastPoll?: boolean;
}

// NOTE: these two types need to be repeated in the bluetooth.d.ts declaration file
export interface IConnectDevice {
	id: string;
	name: string;
	uuids: string;
	adData: {
		rssi: number;
		txPower: number;
		serviceData: any;
		manufacturerData: any;
	};
}
export type SelectDeviceFn = (device: IConnectDevice) => void;

export interface IConnectOptions {
  onDevicesFound: OnDevicesFoundFn;
}

export interface ITimeSeriesCapabilities {
  measurementPeriod: number;
  measurement: string;
  valueKey: string;
  units: string;
  minValue: number;
  maxValue: number;
}

export const MaxNumberOfTimeSeriesValues = 1000;

export class Sensor extends EventEmitter<SensorEvent> {
  protected _deviceName: string | undefined;
  private _connected: boolean;
  private _values: ISensorValues;
  private _experimentFilters: BluetoothRequestDeviceFilter[];
  private _capabilities: ISensorCapabilities;
  private pollTimeout: number;
  private pollInterval: number;
  private error: any;

  constructor(options: ISensorOptions) {
    super();
    this._experimentFilters = options.experimentFilters;
    this._capabilities = options.capabilities;
    this._connected = false;
    this._values = {};
    this.pollInterval = options.pollInterval || 1000;
    this.error = undefined;
  }

  public get experimentFilters() {
    return this._experimentFilters;
  }

  public get capabilities() {
    return this._capabilities;
  }

  public get timeSeriesCapabilities(): ITimeSeriesCapabilities|undefined {
    return undefined; // set in device
  }

  public get connected() {
    return this._connected;
  }

  public get values() {
    return this._values;
  }

  public get deviceName() {
    return this._deviceName || (this._connected ? "Unknown Device" : undefined);
  }

  public connect(options?: IConnectOptions): Promise<void> {
    return Promise.reject("connect() method not overridden!");
  }

  public disconnect(): Promise<void> {
    return Promise.reject("disconnect() method not overridden!");
  }

  public setError(error: any) {
    // only set the first error to help in debugging or allow unset
    if (!this.error || !error) {
      this.error = error;
      const errorData: ISensorErrorData = {
        deviceName: this.deviceName,
        error
      };
      this.emit(SensorEvent.Error, errorData);
    }
  }

  public collectTimeSeries(options: ITimeSeriesCapabilities, callback: (values: IDataTableTimeData[]) => void): () => void {
    throw new Error("collectTimeSeries() method not overridden!");
  }

  protected pollValues(options: IPollOptions): Promise<ISensorValues> {
    return Promise.reject("pollValues() method not overridden!");
  }

  protected setConnecting() {
    this.emit(SensorEvent.Connecting);
  }

  // can't use private setter as it must agree with public getter
  protected setConnected(options: ISetConnectedOptions) {
    const {connected, deviceName} = options;
    const wasConnected = this._connected;
    this._connected = connected;
    const connectionEventData: ISensorConnectionEventData = {
      connected,
      deviceName: deviceName || this.deviceName
    };

    clearTimeout(this.pollTimeout);
    if (connected) {
      this._deviceName = deviceName;
      this.poll({firstPoll: true});
    } else {
      if (wasConnected) {
        this.poll({lastPoll: true});
      }
      this._deviceName = undefined;
    }

    this.emit(SensorEvent.Connection, connectionEventData);
  }

  private poll(options: IPollOptions) {
    const createTimeout = () => {
      this.pollTimeout = window.setTimeout(() => {
        this.sendData(options).then(() => this.poll({firstPoll: false}));
      }, this.pollInterval);
    };

    if (options.firstPoll) {
      // immediately send the data and then queue another poll
      this.sendData(options).then(createTimeout);
    } else if (options.lastPoll) {
      // immediately send the data and then stop
      this.sendData(options);
    } else {
      // queue another poll if not first or last poll
      createTimeout();
    }
  }

  private sendData(options: IPollOptions) {
    return this.pollValues(options)
      .then(values => {
        this._values = values;
        const valuesEventData: ISensorValuesEventData = {
          deviceName: this.deviceName,
          values: this._values
        };
        this.emit(SensorEvent.Values, valuesEventData);
      })
      .catch(error => this.setError(error));
  }
}
