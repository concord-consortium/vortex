import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Experiment } from "./components/experiment";
import { IExperiment, IExperimentConfig } from "./experiment-types";
import ExperimentJSONs from "../data/experiments.json";

import "./index.sass";

const mobileAppConfig: IExperimentConfig = {
  hideLabels: true,
  useSensors: true,
  showEditSaveButton: false,
  showCameraButton: false
};

const ExpandoSchema: React.FC<{experiment: IExperiment}> = ({experiment}) => {
  const [expanded, setExpanded] = useState(false);
  const handleToggleExpanded = () => setExpanded(!expanded);

  return (
    <>
      <div onClick={handleToggleExpanded} className="expando-title">{expanded ? "Hide" : "Show"} Experiment Schema JSON</div>
      {expanded ?
        <pre>
          {JSON.stringify(experiment, null, 2)}
        </pre>
      : undefined}
    </>
  );
};

const experiment1 = ExperimentJSONs[0] as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment1}
      config={mobileAppConfig}
    />
    <ExpandoSchema experiment={experiment1} />
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
        "title": "Collect",
        "icon": "collect",
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
              "pH": {
                "title": "pH",
                "type": "number"
              },
              "airTemp": {
                "title": "Air Temp",
                "type": "number"
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
      {"location": "Corner 2", "pH": "<AVG>"},
      {"location": "Corner 3"},
      {"location": "Corner 4"},
      {"location": "Average", "temperature":  "<AVG>", "illuminance": "<AVG>"},
      {"location": "Sum", "temperature":  "<SUM>", "illuminance": "<SUM>"},
      {"location": "Variance", "temperature":  "<VAR>", "illuminance": "<VAR>"},
      {"location": "StdDev", "temperature":  "<STDDEV>", "illuminance": "<STDDEV>"},
      {"location": "Median", "temperature":  "<MEDIAN>", "illuminance": "<MEDIAN>"}
    ]
  }
} as IExperiment;
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment2}
      config={mobileAppConfig}
    />
    <ExpandoSchema experiment={experiment2} />
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
        "title": "Collect",
        "icon": "collect",
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
    <ExpandoSchema experiment={experiment3} />
  </>,
  document.getElementById("experiment-3")
);

const experiment4 = {
  "version": "1.0.0",
  "metadata": {
    "uuid": "e431af00-5ef9-44f8-a887-c76caa6ddde1",
    "name": "Data Table Example",
    "initials": "DT"
  },
  "schema": {
    "sections": [
      {
        "title": "Collect",
        "icon": "collect",
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
            "required": [],
            "properties": {
              "location": {
                "title": "Location",
                "type": "string",
                "readOnly": true
              },
              "trees": {
                "title": "Tree Count",
                "type": "number"
              },
              "leafColor": {
                "title": "Leaf Color",
                "type": "array",
                "items": {
                  "type": "string",
                  "enum": ["Green", "Orange", "Red"]
                }
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
          "sensorFields": []
        }
      }
    }
  },
  "data": {
    "experimentData": [
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
      experiment={experiment4}
      config={mobileAppConfig}
    />
    <ExpandoSchema experiment={experiment4} />
  </>,
  document.getElementById("experiment-4")
);
