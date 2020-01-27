import React from "react";
import ReactDOM from "react-dom";
import { Experiment } from "./components/experiment";
import { IExperiment } from "./experiment-types";

import "./index.sass";

const experiment: IExperiment = {
  "version": "1.0.0",
  "metadata": {
    "uuid": "e431af00-5ef9-44f8-a887-c76caa6ddde1",
    "name": "Schoolyard Investigation",
    "initials": "SI"
  },
  "schema": {
    "sections": [
      {
        "title": "Label",
        "icon": "assignment",
        "formFields": ["studySite", "label", "groupMembers"]
      },
      {
        "title": "Measure",
        "icon": "settings_input_antenna",
        "formFields": ["experimentData"]
      },
      {
        "title": "Photo",
        "icon": "photo_camera",
        "formFields": []
      },
      {
        "title": "Note",
        "icon": "comment",
        "formFields": ["note"]
      }
    ],
    "dataSchema": {
      "type": "object",
      "required": ["studySite", "label"],
      "properties": {
        "studySite": {
          "title": "Study Site",
          "type": "string",
          "enum": [
            "site1",
            "site2"
          ],
          "enumNames": [
            "Site @1: Conservation Practice in Place",
            "Site @2"
          ]
        },
        "label": {
          "title": "Label",
          "type": "string"
        },
        "groupMembers": {
          "title": "Group Members",
          "type": "string"
        },
        "experimentData": {
          "title": "Experiment Data",
          "type": "object",
          "properties": {
            "temperature": {
              "title": "Temperature",
              "type": "array",
              "items": {
                "type": ["null", "number"]
              }
            },
            "light": {
              "title": "Light",
              "type": "array",
              "items": {
                "type": ["null", "number"]
              }
            },
            "humidity": {
              "title": "Humidity",
              "type": "array",
              "items": {
                "type": ["null", "number"]
              }
            }
          }
        },
        "note": {
          "title": "Notes",
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "formUiSchema": {
      "studySite": {
        "ui:icon": "assignment",
        "ui:placeholder": "Study Site"
      },
      "label": {
        "ui:icon": "label",
        "ui:placeholder": "My Experiment 1"
      },
      "groupMembers": {
        "ui:icon": "people",
        "ui:placeholder": "Group Team Members"
      },
      "note": {
        "items": {
          "ui:widget": "textarea"
        }
      }
    }
  }
};
ReactDOM.render(
  <>
    <Experiment
      experiment={experiment}
    />
    <h4>Experiment Schema JSON</h4>
    <pre>
      {JSON.stringify(experiment, null, 2)}
    </pre>
  </>,
  document.getElementById("experiment-1")
);
