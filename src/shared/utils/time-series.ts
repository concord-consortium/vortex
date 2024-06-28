export interface ITimeSeriesMetadata {
  measurement: string;
  measurementPeriod: number;
  units: string;
  minValue: number;
  maxValue: number;
}

export interface ITimeSeriesCapabilities extends ITimeSeriesMetadata {
  minMeasurementPeriod: number;
  defaultMeasurementPeriod: number;
  valueKey: string;
}

export const TimeSeriesDataKey = "timeSeries";
export const TimeSeriesMetadataKey = "timeSeriesMetadata";
export const MaxNumberOfTimeSeriesValues = 1000;

export const getTimeSeriesMetadata = (capabilities: ITimeSeriesCapabilities): ITimeSeriesMetadata => {
  const {measurement, measurementPeriod, units, minValue, maxValue} = capabilities;
  return {measurement, measurementPeriod, units, minValue, maxValue};
};

