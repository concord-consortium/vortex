import { TimeSeriesDataKey, TimeSeriesMetadataKey } from "../../shared/utils/time-series";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";
import { downloadCSV, getFilename, getRows, getTimeKey, sortNaturally } from "./download-csv";

const tabularExperiment: IExperiment = {
  version: "1.0.0",
  metadata: {
    uuid: "59f660d6-0593-4f6a-9d54-35caed536095",
    name: "Tabular Experiment",
    initials: "TE",
    iconColor: "#000",
    iconHoverColor: "#777"
  },
  schema: {
    dataSchema: {
      properties: {
        experimentData: {
          items: {
            properties: {
              foo: {
                title: "Foo"
              },
              bar: {
                title: "Bar"
              }
            }
          }
        }
      }
    }
  } as any,
  data: {}
};
const tabularData: IExperimentData = {
  timestamp: 123456789,
  experimentData: [
    {foo: 1, bar: 2},
    {foo: 2, bar: 3},
    {foo: "<AVG>", bar: "<AVG>"},
  ]
};

const timeSeriesExperiment: IExperiment = {
  version: "1.0.0",
  metadata: {
    uuid: "bfca7fb5-39ea-4238-8515-e469c44aa872",
    name: "Time Series Experiment",
    initials: "TS",
    iconColor: "#000",
    iconHoverColor: "#777"
  },
  schema: {
    dataSchema: {
      properties: {
        experimentData: {
          items: {
            properties: {
              [TimeSeriesDataKey]: {
                title: "Results"
              },
              label: {
                title: "Label",
                isTimeSeriesLabel: true
              },
              extraData: {
                title: "Extra Data"
              }
            }
          }
        }
      }
    },
    formUiSchema: {
      experimentData: {
        "ui:dataTableOptions": {
          sensorFields: [TimeSeriesDataKey]
        }
      }
    }
  } as any,
  data: {}
};
const timeSeriesData: IExperimentData = {
  timestamp: 987654321,
  experimentData: [
    {[TimeSeriesDataKey]: [1, 2], [TimeSeriesMetadataKey]: { measurementPeriod: 1000}, label: "First Label", extraData: "one"},
    {[TimeSeriesDataKey]: [3, 4], [TimeSeriesMetadataKey]: { measurementPeriod: 2000}, label: "Second Label", extraData: "two"}
  ]
};

describe("download csv functions", () => {

  describe("getTimeKey()", () => {
    it("works for integers", () => {
      expect(getTimeKey(0)).toBe("0");
    });
    it("works for floats, up to 3 digits", () => {
      expect(getTimeKey(0.1)).toBe("0.1");
      expect(getTimeKey(0.10)).toBe("0.1");
      expect(getTimeKey(0.100)).toBe("0.1");
      expect(getTimeKey(0.101)).toBe("0.101");
      expect(getTimeKey(0.1011)).toBe("0.101");
      expect(getTimeKey(0.1000000001)).toBe("0.1");
    });
  });

  describe("sortNaturally()", () => {
    it("sorts", () => {
      expect(sortNaturally(["20", "2", "1", "100", "10", "20.1"])).toStrictEqual(["1", "2", "10", "20", "20.1", "100"]);
    });
  });

  describe("getFileName()", () => {
    it("generates filename", () => {
      expect(getFilename(tabularExperiment, tabularData)).toBe("tabular-experiment-123456789.csv");
      expect(getFilename(timeSeriesExperiment, timeSeriesData)).toBe("time-series-experiment-987654321.csv");
    });
  });

  describe("getRows()", () => {
    it("works for tabular data with function symbols", () => {
      expect(getRows(tabularExperiment, tabularData)).toStrictEqual([
        {Foo: 1, Bar: 2},
        {Foo: 2, Bar: 3},
        {Foo: 1.5, Bar: 2.5},
      ]);
    });

    it("works for time series data", () => {
      expect(getRows(timeSeriesExperiment, timeSeriesData)).toStrictEqual([
        {
          "Time": "0",
          "First Label": "1",
          "Second Label": "3",
          "Row 1 Extra Data": "one",
          "Row 2 Extra Data": "two",
        },
        {
          "Time": "1",
          "First Label": "2",
          "Second Label": "",
          "Row 1 Extra Data": "one",
          "Row 2 Extra Data": "two",
        },
        {
          "Time": "2",
          "First Label": "",
          "Second Label": "4",
          "Row 1 Extra Data": "one",
          "Row 2 Extra Data": "two",
        },
      ]);
    });
  });

  describe("downloadCSV", () => {
    it("downloads", () => {
      const createObjectURL = jest.fn();
      const appendChild = jest.fn();
      const removeChild = jest.fn();

      const saveUrl = window.URL;
      const saveBody = document.body;
      window.URL = { createObjectURL } as any;
      document.body.appendChild = appendChild;
      document.body.removeChild = removeChild;

      downloadCSV(tabularExperiment, tabularData);

      expect(createObjectURL).toBeCalledTimes(1);
      expect(appendChild).toBeCalledTimes(1);
      expect(removeChild).toBeCalledTimes(1);

      window.URL = saveUrl;
      document.body = saveBody;
    });
  });
});