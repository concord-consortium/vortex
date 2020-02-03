import React, { useState } from "react";
import { FieldProps } from "react-jsonschema-form";
import css from "./data-table-field.module.scss";
import { MockSensor } from "../../sensors/mock-sensor";
import { AllCapabilities, Sensor, SensorCapabilityKey } from "../../sensors/sensor";
import { SensorComponent } from "../../mobile-app/components/sensor";
import { IVortexFormContext } from "./form";
import { getURLParam } from "../utils/get-url-param";
import { DeviceSensor } from "../../sensors/device-sensor";
import { JSONSchema7 } from "json-schema";
import { IFormUiSchema } from "../experiment-types";
import { Icon } from "./icon";
import { IUseSensorResult, useSensor } from "../../mobile-app/hooks/use-sensor";

const useMockSensor = getURLParam("mockSensor") || false;

let sensorInstance: Sensor | null = null;
const getSensor = () => {
  if (!sensorInstance) {
    if (useMockSensor) {
      sensorInstance = new MockSensor({
        capabilities: AllCapabilities,
        pollInterval: 500,
        deviceName: "Mocked Sensor"
      });
    } else {
      sensorInstance = new DeviceSensor({
        capabilities: AllCapabilities
      });
    }
  }
  return sensorInstance;
};

const validateSchema = (schema: JSONSchema7)  => {
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
};

const isRowComplete = (row: {[k: string]: any}, tablePropNames: string[]) => {
  let result = true;
  tablePropNames.forEach(name => {
    if (row[name] === undefined) {
      result = false;
    }
  });
  return result;
};

export const DataTableField: React.FC<FieldProps> = props => {
  const { schema, onChange } = props;
  const [formData, setFormData] = useState<any>(props.formData);

  // Cast some types to Vortex-specific types so it's easier to work with them in the code below.
  const formContext: IVortexFormContext = props.formContext;
  const uiSchema: IFormUiSchema = props.uiSchema as IFormUiSchema;
  let sensorOutput: IUseSensorResult | null = null;
  if (formContext.experimentConfig.useSensors) {
    sensorOutput = useSensor(getSensor());
  }

  try {
    validateSchema(schema as JSONSchema7);
  } catch (e) {
    return <div>{e.message}</div>
  }
  const tableDef = (schema.items as JSONSchema7).properties as {[k: string]: JSONSchema7};
  let tablePropNames = Object.keys(tableDef);

  const sensorProps = sensorOutput && uiSchema["ui:dataTableOptions"]?.sensorFields;
  const nonSensorProps = sensorProps && tablePropNames.filter(name => sensorProps.indexOf(name) === -1);
  if (sensorProps && nonSensorProps) {
    // Change order of fields, so non-sensor fields are rendered first.
    tablePropNames = nonSensorProps.concat(sensorProps);
  }

  const handleInputChange = (rowIdx: number, propName: string, event: React.FormEvent<HTMLInputElement>) => {
    // First update internal state, keep strings.
    let newData = formData.slice();
    const rawValue = event.currentTarget.value;
    newData[rowIdx] = Object.assign({}, newData[rowIdx], {[propName]: rawValue});
    setFormData(newData);
    // Then, notify parent component that data has changed. Try to cast to proper type if possible.
    newData = formData.slice();
    const value = tableDef[propName].type === "number" && !isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
    newData[rowIdx] = Object.assign({}, newData[rowIdx], {[propName]: value});
    onChange(newData);
  };

  const onSensorRecordClick = (rowIdx: number) => {
    if (!sensorOutput || !sensorOutput.connected) {
      alert("Sensor not connected");
      return;
    }
    if (sensorProps) {
      const values = sensorOutput.values;
      const result: {[k: string]: number} = {};
      sensorProps.forEach((name: SensorCapabilityKey) => {
        if (!values[name]) {
          alert(`Property ${name} is not supported by selected sensor`);
        } else {
          result[name] = Number(values[name]?.toFixed(3));
        }
      });
      const newData = formData.slice();
      newData[rowIdx] = Object.assign({}, newData[rowIdx], result);
      setFormData(newData);
      onChange(formData);
    }
  };

  const renderRowWithSensorSupport = (row: {[k: string]: any}, rowIdx: number) => {
    if (!sensorProps || !nonSensorProps || !sensorOutput) {
      return;
    }

    // Record button should be rendered only on the initial run, when all the values are still undefined.
    // Once user uses this buttons and some values are saved, render normal table cells.
    let shouldRenderRecordBtn = true;
    sensorProps.forEach((name: string) => {
      if (row[name] !== undefined) {
        shouldRenderRecordBtn = false;
      }
    });

    let cells: JSX.Element[] = [];

    if (!shouldRenderRecordBtn) {
      cells = renderRowWithoutSensorSupport(row, rowIdx);
    } else {
      const nonSensorCells = nonSensorProps.map(name =>
        <td key={name} className={tableDef[name].readOnly ? css.readOnly : ""}>
          { tableDef[name].readOnly ? row[name] : <input type="text" value={row[name]} /> }
        </td>
      );
      const sensorConnected = sensorOutput.connected;
      const recordSensorBtn = <td key="recordBtn" colSpan={sensorProps.length}>
        <div
          className={css.recordSensorReading + ` ${sensorConnected ? css.active : ""}`}
          onClick={sensorConnected ? onSensorRecordClick.bind(null, rowIdx) : null}
        >
          Record Sensor Reading
        </div>
      </td>;
      cells = cells.concat(nonSensorCells).concat(recordSensorBtn);
    }
    // Refresh button is active when record button isn't rendered anymore.
    const refreshActive = sensorOutput.connected && !shouldRenderRecordBtn;
    const refreshBtn = <td key="refreshBtn" className={css.refreshSensorReadingColumn}>
      <div
        className={css.refreshSensorReading + ` ${refreshActive ? css.active : ""}`}
        onClick={refreshActive ? onSensorRecordClick.bind(null, rowIdx) : null}
      >
        <Icon name="refresh" fill="#fff" />
      </div>
    </td>;
    return cells.concat(refreshBtn);
  };

  const renderRowWithoutSensorSupport = (row: {[k: string]: any}, rowIdx: number) => {
    return tablePropNames.map(name =>
      <td key={name} className={tableDef[name].readOnly ? css.readOnly : ""}>
        { tableDef[name].readOnly ? row[name] : <input type="text" value={row[name]} onChange={handleInputChange.bind(null, rowIdx, name)}/> }
      </td>
    );
  };

  return (
    <div className={css.dataTable}>
      { sensorOutput && <SensorComponent sensor={getSensor()} />}
      <table className={css.table}>
        <tbody>
          <tr>
            {tablePropNames.map(name => <th key={name}>{tableDef[name].title || name}</th>)}
            { sensorOutput && <th key="refreshCol" className={css.refreshSensorReadingColumn} />}
          </tr>
          {
            formData.map((row: {[k: string]: any}, idx: number) =>
              <tr key={idx} className={isRowComplete(row, tablePropNames) ? css.active : ""}>
                { sensorOutput ? renderRowWithSensorSupport(row, idx) : renderRowWithoutSensorSupport(row, idx) }
              </tr>
            )
          }
        </tbody>
      </table>
    </div>
  );
};
