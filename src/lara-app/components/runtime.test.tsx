import { generateDataset } from "./runtime";
import { IExperiment } from "../../shared/experiment-types";

describe("generateDataset helper", () => {
  it("generates dataset following IDataset interface from experiment definition and experiment data", () => {
    const experiment = {
      schema: {
        dataSchema: {
          properties: {
            experimentData: {
              items: {
                properties: {
                  location: {
                    title: "Location",
                    type: "string",
                    readOnly: true
                  },
                  temperature: {
                    title: "Temperature (\u00B0C)",
                    type: "number"
                  },
                  humidity: {
                    title: "Humidity (%)",
                    type: "number"
                  },
                  illuminance: {
                    title: "Illuminance (lux)",
                    type: "number"
                  }
                }
              }
            }
          }
        }
      }
    } as unknown as IExperiment;
    const data = {
      experimentData: [
        {location: "corner1", temperature: 1, humidity: 10, illuminance: 100},
        {location: "corner2", temperature: 2, humidity: 11, illuminance: 110},
        {location: "corner3", temperature: 3, humidity: 12, illuminance: 120},
      ]
    };

    const dataset = generateDataset(data, experiment);
    expect(dataset).toEqual({
      type: "dataset",
      version: 1,
      properties: ["Location", "Temperature (\u00B0C)", "Humidity (%)", "Illuminance (lux)"],
      xAxisProp: "Location", // 1st prop
      rows: [
        ["corner1", 1, 10, 100],
        ["corner2", 2, 11, 110],
        ["corner3", 3, 12, 120]
      ]
    });
  });
});
