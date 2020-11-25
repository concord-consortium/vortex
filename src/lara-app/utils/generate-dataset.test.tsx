import { generateDataset, xAxisPropertyForExperiment } from "./generate-dataset";
import { IExperiment } from "../../shared/experiment-types";
import { Experiments } from "../../mobile-app/hooks/use-experiments";
const experiments = require("../../data/experiments.json") as Experiments;

describe("generateDataset helper", () => {
  it("generates dataset following IDataset interface from experiment definition and experiment data", () => {
    const experiment = {
      metadata: {
        uuid: "e431af00-5ef9-44f8-a887-c76caa6ddde1"
      },
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
      xAxisProp: "Location",
      rows: [
        ["corner1", 1, 10, 100],
        ["corner2", 2, 11, 110],
        ["corner3", 3, 12, 120]
      ]
    });
  });

  // This test should ensure that when new epxeriment is added, developer won't miss xAxisPropertyForExperiment hash.
  it("has defined xAxisPropertyForExperiment for each experiment", () => {
    const supportedExperiments = Object.keys(xAxisPropertyForExperiment);
    experiments.forEach(experiment => {
      // Note that simple xAxisPropertyForExperiment[experiment.metadata.uuid] won't work here,
      // as `undefined` is a valid value in this hash.
      expect(supportedExperiments.indexOf(experiment.metadata.uuid)).not.toEqual(-1);
    });
  })
});
