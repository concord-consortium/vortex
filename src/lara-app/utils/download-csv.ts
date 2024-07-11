import {unparse} from "papaparse";

import { IDataTableRow } from "../../shared/components/data-table-field";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { isFunctionSymbol, handleSpecialValue } from "../../shared/utils/handle-special-value";
import { ITimeSeriesMetadata, TimeSeriesDataKey, TimeSeriesMetadataKey } from "../../shared/utils/time-series";

type TimeValues = Record<string, string|undefined>;
type OtherValues = Record<string, any>;
type TimeSeriesRow = {timeValues: TimeValues, units: string, otherValues: OtherValues};

export const getTimeKey = (time: number) => time.toFixed(3).replace(/\.?0+$/, "");

const naturalCollator = Intl.Collator(undefined, { numeric: true });
export const sortNaturally = (arr: string[]): string[] => {
  arr.sort((a, b) => naturalCollator.compare(a, b));
  return arr;
};

export const getRowValue = (key: string, rawRow: IDataTableRow, rawRows: IDataTableRow[]) => {
  let value: any = rawRow[key] ?? "";
  if (isFunctionSymbol(value)) {
    value = handleSpecialValue(value, key, rawRows);
    if (value === undefined) {
      value = "";
    }
  }
  return value;
};

export const getRows = (experiment: IExperiment, data: IExperimentData) => {
  // get all columns
  const properties = experiment.schema.dataSchema.properties.experimentData?.items?.properties ?? {};
  const titleMap = Object.keys(properties).reduce<Record<string,string>>((acc, key) => {
    acc[key] = properties[key].title ?? key;
    return acc;
  }, {});

  const rawRows: IDataTableRow[] = data.experimentData;
  const isTimeSeries = (experiment.schema.formUiSchema?.experimentData?.["ui:dataTableOptions"]?.sensorFields || []).indexOf(TimeSeriesDataKey) !== -1;

  if (isTimeSeries) {
    const timeSeriesLabelKey = Object.keys(properties).find(key => properties[key].isTimeSeriesLabel);
    const nonTimeSeriesTitles = Object.keys(titleMap).filter(key => (key !== TimeSeriesDataKey) && (key !== timeSeriesLabelKey));
    const timeKeys = new Set<string>();
    const timeSeriesRows: TimeSeriesRow[] = [];

    rawRows.forEach(rawRow => {
      const timeValues: TimeValues = {};
      const otherValues: OtherValues = {};

      nonTimeSeriesTitles.forEach(key => {
        otherValues[titleMap[key]] = getRowValue(key, rawRow, rawRows);
      });

      const timeSeries = (rawRow[TimeSeriesDataKey] ?? []) as number[];
      const {measurementPeriod, units} = (rawRow[TimeSeriesMetadataKey] ?? {measurementPeriod: 0, units: ""}) as ITimeSeriesMetadata;
      const timeDelta = measurementPeriod / 1000;
      timeSeries.forEach((value, index) => {
        const time = index * timeDelta;
        const timeKey = getTimeKey(time);
        timeValues[timeKey] = String(value);
        timeKeys.add(timeKey);
      });

      timeSeriesRows.push({timeValues, units, otherValues});
    }, []);
    const sortedTimeKeys = sortNaturally(Array.from(timeKeys));

    // unroll each time/value reading into its own row
    const unrolledRows: Record<string,any>[] = [];
    const timeSeriesKey = titleMap[TimeSeriesDataKey] ?? "Time Series Value";
    sortedTimeKeys.forEach(timeKey => {
      const row: Record<string, any> = {Time: timeKey};
      timeSeriesRows.forEach(({timeValues, units}, rowIndex) => {
        const rowKey = ((timeSeriesLabelKey && rawRows[rowIndex][timeSeriesLabelKey]) as string|undefined) || `Row ${rowIndex + 1} ${timeSeriesKey}`;
        const unitsSuffix = units ? ` (${units})` : "";
        row[`${rowKey}${unitsSuffix}`] = timeValues[timeKey] ?? "";
      });
      timeSeriesRows.forEach(({otherValues}, rowIndex) => {
        nonTimeSeriesTitles.forEach(key => {
          const title = titleMap[key];
          row[`Row ${rowIndex + 1} ${title}`] = otherValues[title] ?? "";
        });
      });
      unrolledRows.push(row);
    });

    return unrolledRows;
  }

  // create an empty row with all the experiment columns to ensure it in the same order
  const emptyRow = Object.values(titleMap).reduce<Record<string,any>>((acc, value) => {
    acc[value] = "";
    return acc;
  }, {});

  return rawRows.map(rawRow => {
    return Object.keys(rawRow).reduce<Record<string,any>>((acc, key) => {
      acc[titleMap[key] ?? key] = getRowValue(key, rawRow, rawRows);
      return acc;
    }, {...emptyRow});
  });
};

export const getFilename = (experiment: IExperiment, data: IExperimentData) => {
  return `${experiment.metadata.name.trim().toLowerCase().replace(/[^a-zA-Z]/g, "-")}-${data.timestamp}.csv`;
};

export const downloadCSV = (experiment: IExperiment, data: IExperimentData) => {
  const rows = getRows(experiment, data);
  const blob = new Blob([unparse(rows)], { type: 'text/csv' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = getFilename(experiment, data);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};