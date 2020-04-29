import React, { useState, useEffect, useRef } from "react";
import { FieldProps } from "react-jsonschema-form";
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
import { tableKeyboardNav } from "../utils/table-keyboard-nav";
import { MenuComponent, MenuItemComponent } from "./menu";
import { confirm, alert } from "../../shared/utils/dialogs";

import css from "./data-table-field.module.scss";

const defPrecision = 2;

const getSumAndCount = (name: string, formData: IDataTableData) => {
  let sum = 0;
  let count = 0;
  formData.forEach(row => {
    const value = Number(row[name]);
    if (!isNaN(value)) {
      sum += value;
      count += 1;
    }
  });
  return {sum, count};
};

const getSquareDiffAndCount = (name: string, formData: IDataTableData) => {
  let squareDiff = 0;
  const {sum, count} = getSumAndCount(name, formData);
  if (count > 0) {
    const mean = sum / count;
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        squareDiff += Math.pow((value - mean), 2);
      }
    });
  }
  return {squareDiff, count};
};

// Authors can provide special values in the initial form data. They will be dynamically evaluated.
const fieldFunction: {[key: string]: (name: string, formData: IDataTableData) => number | undefined} = {
  // average: sum(cells)/#cells
  "<AVG>": (name: string, formData: IDataTableData) => {
    const {sum, count} = getSumAndCount(name, formData);
    if (count === 0) {
      return undefined;
    }
    return Number((sum / count).toFixed(defPrecision));
  },
  // sum: sum(cells)
  "<SUM>": (name: string, formData: IDataTableData) => {
    const {sum, count} = getSumAndCount(name, formData);
    if (count === 0) {
      return undefined;
    }
    return Number((sum).toFixed(defPrecision));
  },
  // variance: (sum(cells-mean)^2/#cells-1)
  "<VAR>": (name: string, formData: IDataTableData) => {
    const {squareDiff, count} = getSquareDiffAndCount(name, formData);
    if (count < 2) {
      return undefined;
    }
    return Number((squareDiff / (count - 1)).toFixed(defPrecision));
  },
  // stdev: sqrt((sum(cells-mean)^2/#cells-1))
  "<STDDEV>": (name: string, formData: IDataTableData) => {
    const {squareDiff, count} = getSquareDiffAndCount(name, formData);
    if (count < 2) {
      return undefined;
    }
    return Number((Math.sqrt(squareDiff / (count - 1))).toFixed(defPrecision));
  },
  // median: (n+1)/2 th item in an ordered list
  "<MEDIAN>": (name: string, formData: IDataTableData) => {
    const values: number[] = [];
    formData.forEach(row => {
      const value = Number(row[name]);
      if (!isNaN(value)) {
        values.push(value);
      }
    });
    const numValues = values.length;
    if (numValues === 0) {
      return undefined;
    }
    values.sort((a, b) => a - b);
    let result: number;
    const midPoint = Math.floor(numValues / 2);
    if (numValues % 2 === 0) {
      // even numbered list, use average of two around center
      result = (values[midPoint - 1] + values[midPoint]) / 2;
    } else {
      // odd numbered list, use center
      result = values[midPoint];
    }
    return Number(result.toFixed(defPrecision));
  }
};

const isFunctionSymbol = (value: string) => {
  return Object.keys(fieldFunction).indexOf(value) !== -1;
};

// Schema that is accepted by this component.
type IDataTableField = IDataTableStringInputField | IDataTableNumberInputField | IDataTableArrayField;
interface IDataTableStringInputField {
  type: "string";
  title?: string;
  readOnly?: boolean;
}
interface IDataTableNumberInputField {
  type: "number" | "integer";
  title?: string;
  readOnly?: boolean;
  minimum?: number;
  maximum?: number;
}
interface IDataTableArrayFieldItems {
  type: "string" | "number";
  enum: any[];
}
interface IDataTableArrayField {
  type: "array";
  items: IDataTableArrayFieldItems;
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

// cache sensors so they are re-used on renders, otherwise, re-connects and disconnects aren't
// handled by the same object
const sensorCache: {[key: string]: MockSensor | DeviceSensor} = {};

const getSensor = (sensorFields: string[]) => {
  const useMockSensor = !!getURLParam("mockSensor");
  const capabilities: ISensorCapabilities = {};
  sensorFields.forEach(fieldName => capabilities[fieldName as SensorCapabilityKey] = true);
  const key = JSON.stringify(capabilities);
  if (!sensorCache[key]) {
    if (useMockSensor) {
      sensorCache[key] = new MockSensor({
        capabilities,
        pollInterval: 500,
        deviceName: "Mocked Sensor",
        showDevicePicker: !!getURLParam("showDevicePicker") || false
      });
    } else {
      sensorCache[key] = new DeviceSensor({
        capabilities
      });
    }
  }
  return sensorCache[key];
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

const castToExpectedTypes = (fieldDefinition: {[propName: string]: IDataTableField}, formData: IDataTableData) => {
  const newData: IDataTableData = [];
  formData.forEach((row, rowIdx) => {
    const newRow: IDataTableRow = {};
    newData.push(newRow);
    Object.keys(row).forEach(propName => {
      const rawValue = formData[rowIdx][propName];
      newRow[propName] = fieldDefinition[propName].type === "number" && !isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
    });
  });
  return newData;
};

// Note that there's assumption that data has been updated ONLY when some value has been edited. New values or updates from undefined to real value shouldn't
// be considered as "update".
const dataEdited = (newData: IDataTableData, oldData: IDataTableData) => {
  let result = false;
  oldData.forEach((row, rowIdx) => {
    Object.keys(row).forEach(propName => {
      if (row[propName] !== undefined && row[propName] !== "" && row[propName] !== newData[rowIdx][propName]) {
        result = true;
      }
    });
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
  if (props.formData.constructor !== Array) {
    return <div>Unexpected form data format</div>;
  }
  const fieldDefinition = validatedSchema.items.properties;
  const fieldKeys = Object.keys(fieldDefinition);
  // Cast some types to Vortex-specific types so it's easier to work with them in the code below.
  const formContext: IVortexFormContext = props.formContext || {};
  const uiSchema: IFormUiSchema = props.uiSchema as IFormUiSchema;
  const sensorFields = uiSchema["ui:dataTableOptions"]?.sensorFields || [];
  // Sensor instance can be provided in form context or it'll be created using sensorFields as capabilities.
  const sensor = formContext.experimentConfig?.useSensors && sensorFields.length > 0 ? (formContext.sensor || getSensor(sensorFields)) : null;
  const sensorOutput = useSensor(sensor);
  const titleField = uiSchema["ui:dataTableOptions"]?.titleField;
  const title = titleField && formContext.formData[titleField] || "";
  const [formData, setFormData] = useState<IDataTableData>(props.formData);
  const [manualEntryMode, setManualEntryMode] = useState<boolean>(false);
  const showImportButton = !!formContext.experimentConfig?.callbacks?.onImport;
  const showEditSaveButton = !!formContext.experimentConfig?.showEditSaveButton;
  const showShowSensorButton = !!formContext.experimentConfig?.showShowSensorButton;
  const [showSensor, setShowSensor] = useState<boolean>(!!sensor && !showShowSensorButton); // auto show the sensor if defined and showSensorButton is false

  // listen for prop changes from uploads
  useEffect(() => {
    setFormData(props.formData);
  }, [props.formData]);

  // Notifies parent component that data has changed. Cast values to proper types if possible.
  const saveData = (newData: IDataTableData) => onChange(castToExpectedTypes(fieldDefinition, newData));

  const validateInput = (propName: string, value: string): {valid: boolean, error?: string} => {
    // allow blanking out
    if ((value === undefined) || (value === "")) {
      return {valid: true};
    }

    const propType = fieldDefinition[propName].type;
    if ((propType === "number") || (propType === "integer")) {
      const {minimum, maximum} = fieldDefinition[propName] as IDataTableNumberInputField;
      let numericValue: number;
      if (propType === "integer") {
        numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) {
          return {valid: false, error: "Not a whole number"};
        }
        if (!value.trim().match(/^[-+]?[0-9]*$/)) {
          return {valid: false, error: "Not a whole number"};
        }
      } else {
        numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
          return {valid: false, error: "Not a number"};
        }
        if (!value.trim().match(/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?$/)) {
          return {valid: false, error: "Not a number"};
        }
      }
      if ((minimum !== undefined) && (numericValue < minimum)) {
        return {valid: false, error: `Must be ≥ ${minimum}`};
      }
      if ((maximum !== undefined) && (numericValue > maximum)) {
        return {valid: false, error: `Must be ≤ ${maximum}`};
      }
    }
    return {valid: true};
  };

  // for now select is the same as input but that will change once we add input validation
  const handleSelectChange = (rowIdx: number, propName: string, event: React.FormEvent<HTMLInputElement>) => {
    handleInputChange(rowIdx, propName, event);
  };
  const handleSelectBlur = () => {
    handleInputBlur();
  };

  const handleInputChange = (rowIdx: number, propName: string, event: React.FormEvent<HTMLInputElement>) => {
    // First update internal state, keep strings here, casting to Numbers here can cause confusing changes of the input.
    const newData = formData.slice();
    const rawValue = event.currentTarget.value;
    newData[rowIdx] = Object.assign({}, newData[rowIdx], { [propName]: rawValue });
    setFormData(newData);
  };

  const handleInputBlur = () => {
    const oldData = props.formData;
    if (formData !== oldData) {
      // New data has been added or something has been edited.
      if (dataEdited(formData, oldData)) {
        // Data has been edited, user has to confirm before new data is saved.
        confirm("Update the value?\nYou edited a value. This will replace the previous value with your updated value.",
          // on ok ...
          () => saveData(formData),
          // on cancel, restore original data.
          () => setFormData(oldData)
        );
      } else {
        // New data has been added. No need to confirm saving.
        saveData(formData);
      }
    }
  };

  const handleEditSaveButton = () => setManualEntryMode(!manualEntryMode);
  const handleImportButton = () => formContext.experimentConfig?.callbacks?.onImport();
  const handleCollectButton = () => setShowSensor(!showSensor);

  const onSensorRecordClick = (rowIdx: number) => {
    if (!sensorOutput.connected) {
      alert("Sensor not connected");
      return;
    }
    let previousValuesAvailable = false;
    sensorFields.forEach((name: SensorCapabilityKey) => {
      if (formData[rowIdx][name] !== undefined && formData[rowIdx][name] !== "") {
        previousValuesAvailable = true;
      }
    });

    const recordData = () => {
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
      saveData(newData);
    };

      if (previousValuesAvailable) {
        confirm("Discard sensor values?\nThis will delete row's current values and allow you to record new values from your sensor.", recordData);
      } else {
        recordData();
      }
  };

  const renderRow = (row: { [k: string]: any }, rowIdx: number) => {
    const basicCells = renderBasicCells(fieldKeys, row, rowIdx);
    if (!showSensor) {
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
          data-test="record-sensor"
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

  const renderSelect = (options: {name: string, value: any, rowIdx: number, items: IDataTableArrayFieldItems}) => {
    const {value, rowIdx, items, name} = options;
    return (
      <select value={value} onChange={handleSelectChange.bind(null, rowIdx, name)} onBlur={handleSelectBlur.bind(null, rowIdx, name)}>
        <>
          <option value="" />
          {items.enum.map(item => <option key={item} value={item}>{item}</option>)}
        </>
      </select>
    );
  };

  const renderInput = (options: {name: string, value: any, rowIdx: number, disabled: boolean, error?: string}) => {
    const {name, value, rowIdx, disabled, error} = options;
    return (
      <>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={handleInputChange.bind(null, rowIdx, name)}
          onBlur={handleInputBlur.bind(null, rowIdx, name)}
        />
        {error ? <div className={css.invalidMarker} /> : undefined}
        {error ? <div className={css.invalidError} >{error}</div> : undefined}
      </>
    );
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
      if (typeof value === "number") {
        // convert non-whole numbers (% 1 != 0) to have 2 decimal places
        value = value % 1 === 0 ? value : value.toFixed(2);
      }
      const isSensorField = sensorFields.indexOf(name) !== -1;
      const {valid, error} = isFunction ? {valid: true, error: undefined} : validateInput(name, String(value));
      let classNames = "";
      if (readOnly) classNames += " " + css.readOnly;
      if (isSensorField) classNames += " " + css.sensorField;
      if (isFunction) classNames += " " + css.function;
      if (!valid) {
        classNames += " " + css.invalid;
      }

      let contents;
      if (readOnly) {
        contents = value;
      } else if (fieldDefinition[name].type === "array") {
        contents = renderSelect({name, value, rowIdx, items: (fieldDefinition[name] as IDataTableArrayField).items});
      } else {
        contents = renderInput({name, value, rowIdx, disabled: isFunction || (isSensorField && !manualEntryMode), error});
      }

      return <td key={name} className={classNames}>{contents}</td>;
    });
  };

  const buttonStyle = (enabled: boolean) => `${css.button}${enabled ? "" : ` ${css.buttonDisabled}`}`;
  const editEnabled = !showSensor;
  const editTitle = editEnabled ? undefined : "Disabled while using the sensor";
  const showSensorEnabled = !manualEntryMode;
  const showSensorTitle = showSensorEnabled ? undefined : "Disabled while editing";

  return (
    <div className={css.dataTable}>
      <div className={css.topBar}>
        <div className={css.topBarLeft}>
          {showSensor && sensor ? <SensorComponent sensor={sensor} manualEntryMode={manualEntryMode} setManualEntryMode={showShowSensorButton ? undefined : setManualEntryMode} /> : undefined}
          {title ? <div className={css.title}>{title}</div> : undefined}
        </div>
        <div className={css.topBarRight}>
          {showImportButton ? <div className={css.button} onClick={handleImportButton}>Import</div> : undefined}
          {showEditSaveButton ? <div className={buttonStyle(editEnabled)} onClick={editEnabled ? handleEditSaveButton : undefined} title={editTitle}>{manualEntryMode ? "Save" : "Edit"}</div> : undefined}
          {showShowSensorButton ? <div className={buttonStyle(showSensorEnabled)} onClick={showSensorEnabled ? handleCollectButton : undefined} title={showSensorTitle}>{showSensor ? "Hide Sensor" : "Use Sensor"}</div> : undefined}
        </div>
      </div>
      <table className={css.table} onKeyDown={tableKeyboardNav}>
        <tbody className={showSensorEnabled && showSensor && !sensorOutput.connected ? css.grayedOut : ""}>
        <tr>
          {showSensor && <th key="refreshCol" className={css.refreshSensorReadingColumn}/>}
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
