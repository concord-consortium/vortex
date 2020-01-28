import EventEmitter from "eventemitter3";

export interface ISensorCapabilities {
  illuminance?: boolean;
  temperature?: boolean;
  humidity?: boolean;
}

export interface ISensorValues {
  illuminance?: number;
  temperature?: number;
  humidity?: number;
}

export interface ISensorOptions {
  capabilities: ISensorCapabilities;
  pollInterval?: number;
}

export const AllCapabilities: ISensorCapabilities = {
  illuminance: true,
  temperature: true,
  humidity: true,
}

export enum SensorEvent {
  Connection = "connection",
  Values = "values",
}

export interface ISensorConnectionEventData {
  connected: boolean;
  deviceName: string;
}
export interface ISensorValuesEventData {
  deviceName: string;
  values: ISensorValues;
}

export class Sensor extends EventEmitter<SensorEvent> {
  protected _deviceName: string | undefined;
  private _connected: boolean;
  private _values: ISensorValues;
  private _capabilities: ISensorCapabilities;
  private pollTimeout: number;
  private pollInterval: number;

  constructor(options: ISensorOptions) {
    super();
    this._capabilities = options.capabilities;
    this._connected = false;
    this._values = {};
    this.pollInterval = options.pollInterval || 1000;
  }

  public get capabilities() {
    return this._capabilities;
  }

  public get connected() {
    return this._connected;
  }

  public get values() {
    return this._values;
  }

  public get deviceName() {
    return this._deviceName || "Unknown Device";
  }

  public connect() {
    throw new Error("connect() method not overridden!");
  }

  public disconnect() {
    throw new Error("disconnect() method not overridden!");
  }

  protected getValues(): ISensorValues {
    throw new Error("getValues() method not overridden!");
  }

  // can't use private setter as it must agree with public getter
  protected setConnected(options: {connected: boolean, deviceName?: string}) {
    const {connected, deviceName} = options;
    this._connected = connected;
    const connectionEventData: ISensorConnectionEventData = {
      connected,
      deviceName: deviceName || this.deviceName
    };

    this.stopPolling();
    this.emit(SensorEvent.Connection, connectionEventData);
    if (connected) {
      this._deviceName = deviceName;
      this.startPolling();
    } else {
      this._deviceName = undefined;
    }
  }

  private sendData() {
    this._values = this.getValues();
    const valuesEventData: ISensorValuesEventData = {
      deviceName: this.deviceName,
      values: this._values
    }
    this.emit(SensorEvent.Values, valuesEventData);
  }

  private poll(options: {sendImmediately: boolean}) {
    if (options.sendImmediately) {
      this.sendData();
    }
    this.pollTimeout = window.setTimeout(() => {
      this.sendData();
      this.continuePolling();
    }, this.pollInterval);
  }

  private startPolling() {
    this.poll({sendImmediately: true});
  }

  private continuePolling() {
    this.poll({sendImmediately: false});
  }

  private stopPolling() {
    clearTimeout(this.pollTimeout);
  }
}