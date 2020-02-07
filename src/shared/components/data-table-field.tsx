import React, { useState } from "react";
import { FieldProps } from "react-jsonschema-form";
import css from "./data-table-field.module.scss";
import { MockSensor } from "../../sensors/mock-sensor";
import { ISensorCapabilities, SensorCapabilityKey } from "../../sensors/sensor";
import { SensorComponent } from "../../mobile-app/components/sensor";
import { IVortexFormContext } from "./form";
import { getURLParam } from "../utils/get-url-param";
import { DeviceSensor } from "../../sensors/device-sensor";
import { JSONSchema7 } from "json-schema";
import { IFormUiSchema } from "../experiment-types";
import { Icon } from "./icon";
import { useSensor } from "../../mobile-app/hooks/use-sensor";

const useMockSensor = getURLParam("mockSensor") || false;

const defPrecision = 2;

// Authors can provide special values in the initial form data. They will be dynamically evaluated.
const fieldFunction: {[key: string]: (name: string, formData: IDataTableData) => number | undefined} = {
  // average
  "<AVG>": (name: string, formData: IDataTableData) => {
    let sum = 0;
    let count = 0;
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        sum += value;
        count += 1;
      }
    });
    if (count === 0) {
      return undefined;
    }
    return Number((sum / count).toFixed(defPrecision));
  },
  "<SUM>": (name: string, formData: IDataTableData) => {
    let sum = 0;
    let count = 0;
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        sum += value;
        count += 1;
      }
    });
    if (count === 0) {
      return undefined;
    }
    return Number((sum).toFixed(defPrecision));
  }
};

const isFunctionSymbol = (value: string) => {
  return Object.keys(fieldFunction).indexOf(value) !== -1;
};

// Schema that is accepted by this component.
interface IDataTableField {
  type: "string" | "number";
  title?: string;
  readOnly?: boolean;
}

interface IDataTableDataSchema {
  type: "array";
  items: {
    type: "object";
    properties: {
      [propName: string]: IDataTableField;
    };
  };
}

// Form data accepted by this component.
interface IDataTableRow {
  [propName: string]: string | number;
}

type IDataTableData = IDataTableRow[];

// Validates if provided schema matches IDataTableDataSchema interface.
const validateSchema = (schema: JSONSchema7): IDataTableDataSchema => {
  if (schema.type !== "array") {
    throw new Error("DataTableField requires array data type");
  }
  if (
    typeof schema.items !== "object" ||
    (schema.items as JSONSchema7).type !== "object" ||
    typeof (schema.items as JSONSchema7).properties !== "object"
  ) {
    throw new Error("DataTableField requires array of objects data type");
  }
  return schema as IDataTableDataSchema;
};

const getSensor = (sensorFields: string[]) => {
  const capabilities: ISensorCapabilities = {};
  sensorFields.forEach(fieldName => capabilities[fieldName as SensorCapabilityKey] = true);
  if (useMockSensor) {
    return new MockSensor({
      capabilities,
      pollInterval: 500,
      deviceName: "Mocked Sensor"
    });
  } else {
    return new DeviceSensor({
      capabilities
    });
  }
};

const isRowComplete = (row: { [k: string]: any }, fieldKeys: string[]) => {
  let result = true;
  fieldKeys.forEach(name => {
    if (row[name] === undefined || isFunctionSymbol(row[name])) {
      result = false;
    }
  });
  return result;
};

export const DataTableField: React.FC<FieldProps> = props => {
  const { schema, onChange } = props;
  let validatedSchema = null;
  try {
    validatedSchema = validateSchema(schema as JSONSchema7);
  } catch (e) {
    return <div>{e.message}</div>;
  }
  const fieldDefinition = validatedSchema.items.properties;
  const fieldKeys = Object.keys(fieldDefinition);
  // Cast some types to Vortex-specific types so it's easier to work with them in the code below.
  const formContext: IVortexFormContext = props.formContext;
  const uiSchema: IFormUiSchema = props.uiSchema as IFormUiSchema;
  const sensorFields = uiSchema["ui:dataTableOptions"]?.sensorFields || [];
  const sensor = formContext.experimentConfig.useSensors ? getSensor(sensorFields) : null;
  const sensorOutput = useSensor(sensor);
  const titleField = uiSchema["ui:dataTableOptions"]?.titleField;
  const title = titleField && formContext.formData[titleField] || "";
  const [formData, setFormData] = useState<IDataTableData>(props.formData);
  // Sensor buttons should be rendered only when sensor is available and some properties are connected to sensor.
  const renderSensorButtons = sensor && sensorFields.length > 0;

  const handleInputChange = (rowIdx: number, propName: string, event: React.FormEvent<HTMLInputElement>) => {
    // First update internal state, keep strings here, casting to Numbers here can cause confusing changes of the input.
    let newData = formData.slice();
    const rawValue = event.currentTarget.value;
    newData[rowIdx] = Object.assign({}, newData[rowIdx], { [propName]: rawValue });
    setFormData(newData);
    // Then, notify parent component that data has changed. Try to cast to proper type if possible.
    newData = formData.slice();
    const value = fieldDefinition[propName].type === "number" && !isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
    newData[rowIdx] = Object.assign({}, newData[rowIdx], { [propName]: value });
    onChange(newData);
  };

  const onSensorRecordClick = (rowIdx: number) => {
    if (!sensorOutput.connected) {
      alert("Sensor not connected");
      return;
    }
    const values = sensorOutput.values;
    const result: { [k: string]: number } = {};
    sensorFields.forEach((name: SensorCapabilityKey) => {
      if (!values[name]) {
        alert(`Property ${name} is not supported by selected sensor`);
      } else {
        result[name] = Number(values[name]?.toFixed(defPrecision));
      }
    });
    const newData = formData.slice();
    newData[rowIdx] = Object.assign({}, newData[rowIdx], result);
    setFormData(newData);
    onChange(formData);
  };

  const renderRow = (row: { [k: string]: any }, rowIdx: number) => {
    const basicCells = renderBasicCells(fieldKeys, row, rowIdx);
    if (!renderSensorButtons) {
      return basicCells;
    }
    // Render another column with sensor record button.
    const anyNonFunctionSensorValues = sensorFields.map(name => row[name]).filter(value => !isFunctionSymbol(value)).length > 0;
    let sensorFieldsBlank = true;
    sensorFields.forEach((name: string) => {
      if (row[name] !== undefined) {
        sensorFieldsBlank = false;
      }
    });
    const active = sensorOutput.connected;
    const refreshBtnCell = <td key="refreshBtn" className={`${css.refreshSensorReadingColumn} ${css.readOnly}`}>
      {
        anyNonFunctionSensorValues &&
        <div
          className={css.refreshSensorReading + ` ${active ? css.active : ""}` + ` ${!sensorFieldsBlank ? css.refresh : ""}`}
          onClick={active ? onSensorRecordClick.bind(null, rowIdx) : null}
        >
          {
            // Show refresh/replay icon if some values are already present.
            !sensorFieldsBlank &&
            <Icon name="replay" /> }
        </div>
      }
    </td>;
    return [refreshBtnCell].concat(basicCells);
  };

  const renderBasicCells = (fieldNames: string[], row: { [k: string]: any }, rowIdx: number) => {
    return fieldNames.map(name => {
      let value = row[name] || "";
      const readOnly = fieldDefinition[name].readOnly;
      let isFunction = false;
      if (isFunctionSymbol(value)) {
        value = fieldFunction[value](name, formData);
        if (value === undefined) {
          value = "--";
        }
        isFunction = true;
      }
      const isSensorField = sensorFields.indexOf(name) !== -1;
      return <td key={name} className={readOnly ? css.readOnly : ""}>
        {readOnly ? value : <input type="text" value={value} disabled={isFunction || isSensorField} onChange={handleInputChange.bind(null, rowIdx, name)}/>}
      </td>;
    });
  };

  return (
    <div className={css.dataTable}>
      {sensor && <SensorComponent sensor={sensor}/>}
      <div className={css.title}>{title}</div>
      <table className={css.table}>
        <tbody className={sensor && !sensorOutput.connected ? css.grayedOut : ""}>
        <tr>
          {renderSensorButtons && <th key="refreshCol" className={css.refreshSensorReadingColumn}/>}
          {fieldKeys.map(name => <th key={name}>{fieldDefinition[name].title || name}</th>)}
        </tr>
        {
          formData.map((row: { [k: string]: any }, idx: number) =>
            <tr key={idx} className={isRowComplete(row, fieldKeys) ? css.complete : ""}>
              { renderRow(row, idx) }
            </tr>
          )
        }
        </tbody>
      </table>
    </div>
  );
};
