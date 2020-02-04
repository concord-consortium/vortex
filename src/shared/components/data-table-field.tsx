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
      autoConnect: true,
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
  let fieldKeys = Object.keys(fieldDefinition);
  // Cast some types to Vortex-specific types so it's easier to work with them in the code below.
  const formContext: IVortexFormContext = props.formContext;
  const uiSchema: IFormUiSchema = props.uiSchema as IFormUiSchema;
  const sensorFields = uiSchema["ui:dataTableOptions"]?.sensorFields || [];
  const nonSensorFields = fieldKeys.filter(name => sensorFields.indexOf(name) === -1);
  if (sensorFields && nonSensorFields) {
    // Change order of fields, so non-sensor fields are rendered first.
    fieldKeys = nonSensorFields.concat(sensorFields);
  }
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

  const renderRowWithSensorSupport = (row: { [k: string]: any }, rowIdx: number) => {
    // Record button should be rendered only on the initial run, when all the values are still undefined.
    // Once user uses this buttons and some values are saved, render normal table cells.
    let shouldRenderRecordBtn = true;
    sensorFields.forEach((name: string) => {
      if (row[name] !== undefined) {
        shouldRenderRecordBtn = false;
      }
    });

    let cells: JSX.Element[] = renderBasicCells(nonSensorFields, row, rowIdx);

    if (shouldRenderRecordBtn) {
      const sensorConnected = sensorOutput.connected;
      const recordSensorBtn = <td key="recordBtn" colSpan={sensorFields.length}>
        <div
          className={css.recordSensorReading + ` ${sensorConnected ? css.active : ""}`}
          onClick={sensorConnected ? onSensorRecordClick.bind(null, rowIdx) : null}
        >
          Record Sensor Reading
        </div>
      </td>;
      cells = cells.concat(recordSensorBtn);
    } else {
      cells = cells.concat(renderBasicCells(sensorFields, row, rowIdx));
    }
    // Refresh button is active when record button isn't rendered anymore.
    const anyNonFunctionSensorValues = sensorFields.map(name => row[name]).filter(value => !isFunctionSymbol(value)).length > 0;
    const refreshActive = sensorOutput.connected && !shouldRenderRecordBtn;
    const refreshBtn = <td key="refreshBtn" className={css.refreshSensorReadingColumn}>
      {
        anyNonFunctionSensorValues &&
        <div
          className={css.refreshSensorReading + ` ${refreshActive ? css.active : ""}`}
          onClick={refreshActive ? onSensorRecordClick.bind(null, rowIdx) : null}
        >
          <Icon name="refresh" fill="#fff"/>
        </div>
      }
    </td>;
    return cells.concat(refreshBtn);
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
      return <td key={name} className={readOnly ? css.readOnly : ""}>
        {readOnly ? value : <input type="text" value={value} disabled={isFunction} onChange={handleInputChange.bind(null, rowIdx, name)}/>}
      </td>
    });
  };

  return (
    <div className={css.dataTable}>
      {sensor && <SensorComponent sensor={sensor}/>}
      <div className={css.title}>{title}</div>
      <table className={css.table}>
        <tbody>
        <tr>
          {fieldKeys.map(name => <th key={name}>{fieldDefinition[name].title || name}</th>)}
          {renderSensorButtons && <th key="refreshCol" className={css.refreshSensorReadingColumn}/>}
        </tr>
        {
          formData.map((row: { [k: string]: any }, idx: number) =>
            <tr key={idx} className={isRowComplete(row, fieldKeys) ? css.active : ""}>
              {renderSensorButtons ? renderRowWithSensorSupport(row, idx) : renderBasicCells(nonSensorFields, row, idx)}
            </tr>
          )
        }
        </tbody>
      </table>
    </div>
  );
};
