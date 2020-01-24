import React from "react";
import ReactDOM from "react-dom";
import { Experiment } from "./components/experiment";

import "./index.sass";
import { IDataSchema } from "./experiment-schema-types";

const experiment1 = {
  sections: [
    {
      title: "Label",
      formFields: ["studySite", "label", "groupMembers"]
    },
    {
      title: "Measure",
      formFields: ["experimentData"]
    }
  ],
  dataSchema: {
    type: "object",
    required: ["studySite", "label"],
    properties: {
      studySite: {
        title: "Study Site",
        type: "string",
        default: "site1",
        enum: [
          "site1",
          "site2"
        ],
        enumNames: [
          "Site @1",
          "Site @2"
        ]
      },
      label: {
        title: "Label",
        type: "string",
      },
      groupMembers: {
        title: "Group Members",
        type: "string"
      },
      experimentData: {
        title: "Experiment Data",
        type: "object",
        properties: {
          temperature: {
            title: "Temperature",
            type: "array",
            items: {
              type: ["null", "number"]
            }
          },
          light: {
            title: "Light",
            type: "array",
            items: {
              type: ["null", "number"]
            }
          },
          humidity: {
            title: "Humidity",
            type: "array",
            items: {
              type: ["null", "number"]
            }
          }
        }
      }
    }
  } as IDataSchema
};
ReactDOM.render(
  <>
    <Experiment
      experimentSchema={experiment1}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      { JSON.stringify(experiment1, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-1")
);
