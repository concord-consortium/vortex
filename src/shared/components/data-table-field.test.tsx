import React from "react";
import { shallow, mount } from "enzyme";
import { DataTableField } from "./data-table-field";
import { FieldProps, IdSchema } from "react-jsonschema-form";
import { JSONSchema6, JSONSchema7 } from "json-schema";
import { SensorComponent } from "../../mobile-app/components/sensor";
import { MockSensor } from "../../sensors/mock-sensor";
import { act } from "react-dom/test-utils";

describe("DataTableField component", () => {
  const noop = jest.fn();
  const defProps: FieldProps = {
    schema: {},
    uiSchema: {},
    idSchema: {} as IdSchema,
    formData: [],
    errorSchema: {},
    onChange: noop,
    onBlur: noop,
    registry: {
      fields: {},
      widgets: {},
      definitions: {},
      formContext: {}
    },
    formContext: {},
    autofocus: false,
    disabled: false,
    readonly: false,
    required: false,
    name: ""
  };

  it("validates provided schema and form data", () => {
    let schema = {};
    let wrapper = shallow(<DataTableField {...defProps} schema={schema} />);
    expect(wrapper.text()).toEqual("DataTableField requires array data type");

    schema = {"type": "array"};
    wrapper = shallow(<DataTableField {...defProps} schema={schema} />);
    expect(wrapper.text()).toEqual("DataTableField requires array of objects data type");

    schema = {
      "type": "array",
      "items": {
        "type": "object",
      }
    };
    wrapper = shallow(<DataTableField {...defProps} schema={schema} />);
    expect(wrapper.text()).toEqual("DataTableField requires array of objects data type");

    schema = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {}
      }
    };
    wrapper = shallow(<DataTableField {...defProps} schema={schema} formData={{notAnArray: true}} />);
    expect(wrapper.text()).toEqual("Unexpected form data format");
  });

  it("renders basic table using provided schema and data", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "title": "Foo column",
            "type": "string",
            "readOnly": true
          },
          "bar": {
            "type": "number"
          }
        }
      }
    };
    const data = [
      {foo: "test1", bar: 1},
      {}
    ];
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} />);
    expect(wrapper.find("table").length).toEqual(1);
    expect(wrapper.find("tr").length).toEqual(3); // headers + 2 data rows
    // Headers
    expect(wrapper.find("th").length).toEqual(2);
    expect(wrapper.find("th").at(0).text()).toEqual("Foo column"); // title
    expect(wrapper.find("th").at(1).text()).toEqual("bar"); // no title defined, so name of the prop
    // Data cells
    expect(wrapper.find("td").length).toEqual(4);
    // First row
    expect(wrapper.find("td").at(0).text()).toEqual("test1");
    expect(wrapper.find("td").at(1).find("input").props().value).toEqual(1);
    // Second row
    expect(wrapper.find("td").at(2).text()).toEqual(""); // empty field
    expect(wrapper.find("td").at(3).find("input").props().value).toEqual(""); // empty field
  });

  it("notifies about data updates and casts values to expected types", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "type": "string"
          },
          "bar": {
            "type": "number"
          }
        }
      }
    };
    const data = [
      {foo: "test1", bar: 1},
      {}
    ];
    const onChange = jest.fn();
    (window as any).confirm = jest.fn(() => true);
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} onChange={onChange} />);

    wrapper.find("input").at(0).simulate('change', {currentTarget: {value: "123"}});
    wrapper.find("input").at(0).simulate('blur');
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 1}, // data is not changed to number, as foo field is a string type
      {}
    ]);

    wrapper.find("input").at(1).simulate('change', {currentTarget: {value: "123"}});
    wrapper.find("input").at(1).simulate('blur');
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123}, // data is changed to number, as bar field is a number type
      {}
    ]);

    wrapper.find("input").at(2).simulate('change', {currentTarget: {value: "321"}});
    wrapper.find("input").at(2).simulate('blur');
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123},
      {foo: "321"} // data is not changed to number, as foo field is a string type
    ]);


    wrapper.find("input").at(3).simulate('change', {currentTarget: {value: "321"}});
    wrapper.find("input").at(3).simulate('blur');
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123},
      {foo: "321", bar: 321} // data is not changed to number, as foo field is a string type
    ]);
  });

  it("doesn't require user confirmation when new data is added", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "type": "string"
          }
        }
      }
    };
    const data = [{}];
    const onChange = jest.fn();
    (window as any).confirm = jest.fn();
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} onChange={onChange} />);

    wrapper.find("input").at(0).simulate('change', {currentTarget: {value: "123"}});
    wrapper.find("input").at(0).simulate('blur');
    expect(window.confirm).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123"}
    ]);
  });

  it("requires user confirmation when data is edited", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "type": "string"
          }
        }
      }
    };
    const data = [
      {foo: "old data"}
    ];
    const onChange = jest.fn();
    (window as any).confirm = jest.fn(() => true);
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} onChange={onChange} />);

    wrapper.find("input").at(0).simulate('change', {currentTarget: {value: "123"}});
    wrapper.find("input").at(0).simulate('blur');
    expect(window.confirm).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
  });

  it("discards edits if user doesn't confirm them", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "type": "string"
          }
        }
      }
    };
    const data = [
      {foo: "test1"}
    ];
    const onChange = jest.fn();
    (window as any).confirm = jest.fn(() => false);
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} onChange={onChange} />);

    wrapper.find("input").at(0).simulate('change', {currentTarget: {value: "123"}});
    wrapper.find("input").at(0).simulate('blur');
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses sensor when useSensors is specified in formContext.experimentConfig object", async () => {
    const mockSensor = new MockSensor({
      capabilities: {temperature: true},
      experimentFilters: [],
      pollInterval: 500,
      deviceName: "Mocked Sensor",
      minValues: {temperature: 10},
      maxValues: {temperature: 10}
    });
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "readOnly": true
          },
          "temperature": {
            "type": "number"
          }
        }
      }
    };
    const uiSchema = {
      "ui:dataTableOptions": {
        "sensorFields": ["temperature"]
      }
    };
    const formContext = {
      experimentConfig: {
        useSensors: true
      },
      sensor: mockSensor
    };
    const data = [
      {location: "corner 1"},
      {location: "corner 2"}
    ];
    const onChange = jest.fn();
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = mount(<DataTableField {...defProps} schema={schema as JSONSchema6} uiSchema={uiSchema} formContext={formContext} formData={data} onChange={onChange} />);

    expect(wrapper.find(SensorComponent).length).toEqual(1);
    // Headers should have one cell more for record button (record, "location", "temperature")
    expect(wrapper.find("th").length).toEqual(3);
    expect(wrapper.find("td").length).toEqual(6); // record button + two data cells x 2 rows
    expect(wrapper.find(SensorComponent).length).toEqual(1);
    // Two record sensor buttons are expected, as there are two predefined rows of data.
    expect(wrapper.find("[data-test='record-sensor']").length).toEqual(2);
    // No replay icons are expected at this point.
    expect(wrapper.find({name: "replay"}).length).toEqual(0);

    // Record sensor values. Sensor not connected yet, nothing should happen.
    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(onChange).not.toHaveBeenCalled();

    // Connect sensor.
    await act(async () => {
      await mockSensor.connect();
    });

    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(onChange).toHaveBeenCalledWith([
      {location: "corner 1", temperature: 10},
      {location: "corner 2"}
    ]);
    expect(wrapper.find({name: "replay"}).length).toEqual(1); // record button should change to refresh button

    wrapper.find("[data-test='record-sensor']").at(1).simulate("click");
    expect(onChange).toHaveBeenCalledWith([
      {location: "corner 1", temperature: 10},
      {location: "corner 2", temperature: 10}
    ]);
    expect(wrapper.find({name: "replay"}).length).toEqual(2);
  });

  it("uses sensor when filters are specified in formContext.experimentConfig object", async () => {
    const mockSensor = new MockSensor({
      capabilities: {},
      experimentFilters: [{
        name: "Mocked Sensor"
      }],
      pollInterval: 500,
      deviceName: "Mocked Sensor",
      minValues: {temperature: 10},
      maxValues: {temperature: 10}
    });
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "readOnly": true
          },
          "temperature": {
            "type": "number"
          }
        }
      }
    };
    const uiSchema = {
      "ui:dataTableOptions": {
        "sensorFields": ["temperature"],
        "filters": [{"name": "Mocked Sensor"}]
      }
    };
    const formContext = {
      experimentConfig: {
        useSensors: true
      },
      sensor: mockSensor
    };
    const data = [
      {location: "corner 1"},
      {location: "corner 2"}
    ];
    const onChange = jest.fn();
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = mount(<DataTableField {...defProps} schema={schema as JSONSchema6} uiSchema={uiSchema} formContext={formContext} formData={data} onChange={onChange} />);

    expect(wrapper.find(SensorComponent).length).toEqual(1);
    // Headers should have one cell more for record button (record, "location", "temperature")
    expect(wrapper.find("th").length).toEqual(3);
    expect(wrapper.find("td").length).toEqual(6); // record button + two data cells x 2 rows
    expect(wrapper.find(SensorComponent).length).toEqual(1);
    // Two record sensor buttons are expected, as there are two predefined rows of data.
    expect(wrapper.find("[data-test='record-sensor']").length).toEqual(2);
    // No replay icons are expected at this point.
    expect(wrapper.find({name: "replay"}).length).toEqual(0);

    // Record sensor values. Sensor not connected yet, nothing should happen.
    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(onChange).not.toHaveBeenCalled();

    expect(mockSensor.connected).toBe(false);

    // Connect sensor.
    await act(async () => {
      await mockSensor.connect();
    });

    expect(mockSensor.connected).toBe(true);

    /*

    TODO: uncomment and update this test when the time series data saving PT story is implemented

    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(onChange).toHaveBeenCalledWith([
      {location: "corner 1", temperature: 10},
      {location: "corner 2"}
    ]);
    expect(wrapper.find({name: "replay"}).length).toEqual(1); // record button should change to refresh button

    wrapper.find("[data-test='record-sensor']").at(1).simulate("click");
    expect(onChange).toHaveBeenCalledWith([
      {location: "corner 1", temperature: 10},
      {location: "corner 2", temperature: 10}
    ]);
    expect(wrapper.find({name: "replay"}).length).toEqual(2);
    */
  });

  it("requires confirmation before sensor values are overwritten", async () => {
    const mockSensor = new MockSensor({
      capabilities: {temperature: true},
      experimentFilters: [],
      pollInterval: 500,
      deviceName: "Mocked Sensor",
      minValues: {temperature: 10},
      maxValues: {temperature: 10}
    });
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "readOnly": true
          },
          "temperature": {
            "type": "number"
          }
        }
      }
    };
    const uiSchema = {
      "ui:dataTableOptions": {
        "sensorFields": ["temperature"]
      }
    };
    const formContext = {
      experimentConfig: {
        useSensors: true
      },
      sensor: mockSensor
    };
    const data = [
      {location: "corner 1", temperature: 5}
    ];
    const onChange = jest.fn();
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = mount(<DataTableField {...defProps} schema={schema as JSONSchema6} uiSchema={uiSchema} formContext={formContext} formData={data} onChange={onChange} />);

    // Connect sensor.
    await act(async () => {
      await mockSensor.connect();
    });

    (window as any).confirm = jest.fn(() => false);
    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(window.confirm).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalledWith();

    (window as any).confirm = jest.fn(() => true);
    wrapper.find("[data-test='record-sensor']").at(0).simulate("click");
    expect(window.confirm).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([
      {location: "corner 1", temperature: 10}
    ]);
  });

  it("handles function definitions", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "p1": {
            "type": "number"
          },
          "p2": {
            "type": "number"
          },
          "p3": {
            "type": "number"
          },
          "p4": {
            "type": "number"
          },
          "p5": {
            "type": "number"
          }
        }
      }
    };
    const getResults = (formData: any) => {
      // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
      const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={formData} />);
      const rowsCount = formData.length;
      const lastRow = wrapper.find("tr").at(rowsCount);
      const avgCell = lastRow.find("input").at(0);
      const sumCell = lastRow.find("input").at(1);
      const varCell = lastRow.find("input").at(2);
      const stdDevCell = lastRow.find("input").at(3);
      const medianCell = lastRow.find("input").at(4);
      // Function inputs should be disabled / non-editable.
      expect(avgCell.props().disabled).toEqual(true);
      expect(sumCell.props().disabled).toEqual(true);
      expect(varCell.props().disabled).toEqual(true);
      expect(stdDevCell.props().disabled).toEqual(true);
      expect(medianCell.props().disabled).toEqual(true);
      return {
        avg: avgCell.props().value,
        sum: sumCell.props().value,
        var: varCell.props().value,
        stdDev: stdDevCell.props().value,
        median: medianCell.props().value,
      };
    };

    let res = getResults([
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"}
    ]);
    expect(res.avg).toEqual("--");
    expect(res.sum).toEqual("--");
    expect(res.var).toEqual("--");
    expect(res.stdDev).toEqual("--");
    expect(res.median).toEqual("--");

    res = getResults([
      {},
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"}
    ]);
    expect(res.avg).toEqual("--");
    expect(res.sum).toEqual("--");
    expect(res.var).toEqual("--");
    expect(res.stdDev).toEqual("--");
    expect(res.median).toEqual("--");

    res = getResults([
      {p1: 1, p2: 2, p3: 3, p4: 4, p5: 5},
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"}
    ]);
    expect(res.avg).toEqual(1);
    expect(res.sum).toEqual(2);
    expect(res.var).toEqual("--");
    expect(res.stdDev).toEqual("--");
    expect(res.median).toEqual(5);

    res = getResults([
      {p1: 1, p2: 2, p3: 3, p4: 4, p5: 5},
      {p1: 6, p2: 7, p3: 8, p4: 9, p5: 10},
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"}
    ]);
    expect(res.avg).toEqual("3.50");
    expect(res.sum).toEqual(9);
    expect(res.var).toEqual("12.50");
    expect(res.stdDev).toEqual("3.54");
    expect(res.median).toEqual("7.50");

    res = getResults([
      {p1: 1, p2: 2, p3: 3, p4: 4, p5: 5},
      {p1: "wrong value, should be ignored", p2: "wrong value, should be ignored", p3: "wrong value, should be ignored", p4: "wrong value, should be ignored", p5: "wrong value, should be ignored"},
      {p1: 6, p2: 7, p3: 8, p4: 9, p5: 10},
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"},
    ]);
    expect(res.avg).toEqual("3.50");
    expect(res.sum).toEqual(9);
    expect(res.var).toEqual("12.50");
    expect(res.stdDev).toEqual("3.54");
    expect(res.median).toEqual("7.50");

    res = getResults([
      {p1: 1, p2: 2, p3: 3, p4: 4, p5: 5},
      {p1: 6, p2: 7, p3: 8, p4: 9, p5: 10},
      {p1: 11, p2: 12, p3: 13, p4: 14, p5: 15},
      {p1: "<AVG>", p2: "<SUM>", p3: "<VAR>", p4: "<STDDEV>", p5: "<MEDIAN>"}
    ]);
    expect(res.avg).toEqual(6);
    expect(res.sum).toEqual(21);
    expect(res.var).toEqual(25);
    expect(res.stdDev).toEqual(5);
    expect(res.median).toEqual(10);
  });

  it("handles dropdown definitions", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "dropdown": {
            "title": "Dropdown",
            "type": "array",
            "items": {
              "type": "string",
              "enum": ["One", "Two", "Three"]
            }
          }
        }
      }
    };

    const formData = [{dropdown: ""}];
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={formData} />);
    expect(wrapper.find("option").length).toBe(4);
    expect(wrapper.find("option").map(option => option.props().value)).toStrictEqual(["", "One", "Two", "Three"]);
    expect(wrapper.find("select").props().value).toBe("");
  });
});
