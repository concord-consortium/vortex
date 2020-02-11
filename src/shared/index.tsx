import React from "react";
import ReactDOM from "react-dom";
import { Experiment } from "./components/experiment";
import { IExperiment } from "./experiment-types";
import ExperimentJSONs from "../data/experiments.json";

import "./index.sass";

const mobileAppConfig = {
  hideLabels: true,
  useSensors: true
};

const experiment1 = ExperimentJSONs[0] as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment1}
      config={mobileAppConfig}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      {JSON.stringify(experiment1, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-1")
);

const experiment2 = {
  "version": "1.0.0",
  "metadata": {
    "uuid": "e431af00-5ef9-44f8-a887-c76caa6ddde1",
    "name": "Data Table Example",
    "initials": "DT"
  },
  "schema": {
    "sections": [
      {
        "title": "Measure",
        "icon": "settings_input_antenna",
        "formFields": ["tableTitle", "experimentData"]
      }
    ],
    "dataSchema": {
      "type": "object",
      "required": ["studySite", "label"],
      "properties": {
        "tableTitle": {
          "title": "Title",
          "type": "string"
        },
        "experimentData": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["location"],
            "properties": {
              "location": {
                "title": "Location",
                "type": "string",
                "readOnly": true
              },
              "comment": {
                "title": "Comment",
                "type": "string"
              },
              "temperature": {
                "title": "Temperature (C)",
                "type": "number"
              },
              "illuminance": {
                "title": "Illuminance (lux)",
                "type": "number"
              }
            }
          }
        }
      }
    },
    "formUiSchema": {
      "tableTitle": {
        "ui:placeholder": "Title"
      },
      "experimentData": {
        "ui:field": "dataTable",
        "ui:dataTableOptions": {
          "sensorFields": ["temperature", "illuminance"],
          "titleField": "tableTitle"
        }
      }
    }
  },
  "data": {
    "experimentData": [
      {"location": "Corner 1"},
      {"location": "Corner 2"},
      {"location": "Corner 3"},
      {"location": "Corner 4"},
      {"location": "Average", "temperature":  "<AVG>", "illuminance": "<AVG>"}
    ]
  }
} as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment2}
      config={mobileAppConfig}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      {JSON.stringify(experiment2, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-2")
);

const experiment3 = {
  "version": "1.0.0",
  "metadata": {
    "uuid": "e431af00-5ef9-44f8-a887-c76caa6ddde1",
    "name": "Data Table Example",
    "initials": "DT"
  },
  "schema": {
    "sections": [
      {
        "title": "Measure",
        "icon": "settings_input_antenna",
        "formFields": ["experimentData"]
      }
    ],
    "dataSchema": {
      "type": "object",
      "required": ["studySite", "label"],
      "properties": {
        "experimentData": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["location"],
            "properties": {
              "location": {
                "title": "Location",
                "type": "string",
                "readOnly": true
              },
              "trees": {
                "title": "Trees Count",
                "type": "number"
              },
              "temperature": {
                "title": "Temperature (C)",
                "type": "number"
              }
            }
          }
        }
      }
    },
    "formUiSchema": {
      "experimentData": {
        "ui:field": "dataTable",
        "ui:dataTableOptions": {
          "sensorFields": ["temperature"]
        }
      }
    }
  },
  "data": {
    "experimentData": [
      {"location": "Sum / Average", "trees": "<SUM>", "temperature":  "<AVG>"},
      {"location": "Corner 1"},
      {"location": "Corner 2"},
      {"location": "Corner 3"},
      {"location": "Corner 4"}
    ]
  }
} as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment3}
      config={mobileAppConfig}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      {JSON.stringify(experiment3, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-3")
);
