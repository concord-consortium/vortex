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
    // React JSONSchema Form types are a bit inconsistent. This library actually accepts JSONSchema7 schema, even though types specify only version 6.
    const wrapper = shallow(<DataTableField {...defProps} schema={schema as JSONSchema6} formData={data} onChange={onChange} />);

    wrapper.find("input").at(0).simulate('change', {currentTarget: {value: "123"}});
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 1}, // data is not changed to number, as foo field is a string type
      {}
    ]);

    wrapper.find("input").at(1).simulate('change', {currentTarget: {value: "123"}});
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123}, // data is changed to number, as bar field is a number type
      {}
    ]);

    wrapper.find("input").at(2).simulate('change', {currentTarget: {value: "321"}});
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123},
      {foo: "321"} // data is not changed to number, as foo field is a string type
    ]);


    wrapper.find("input").at(3).simulate('change', {currentTarget: {value: "321"}});
    expect(onChange).toHaveBeenCalledWith([
      {foo: "123", bar: 123},
      {foo: "321", bar: 321} // data is not changed to number, as foo field is a string type
    ]);
  });

  it("uses sensor when useSensors is specified in formContext.experimentConfig object", async () => {
    const mockSensor = new MockSensor({
      capabilities: {temperature: true},
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

  it("handles function definitions", () => {
    const schema: JSONSchema7 = {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "foo": {
            "type": "number"
          },
          "bar": {
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
      // Function inputs should be disabled / non-editable.
      expect(avgCell.props().disabled).toEqual(true);
      expect(sumCell.props().disabled).toEqual(true);
      return {avg: avgCell.props().value, sum: sumCell.props().value};
    };

    let res = getResults([
      {foo: "<AVG>", bar: "<SUM>"}
    ]);
    expect(res.avg).toEqual("--");
    expect(res.sum).toEqual("--");

    res = getResults([
      {},
      {foo: "<AVG>", bar: "<SUM>"}
    ]);
    expect(res.avg).toEqual("--");
    expect(res.sum).toEqual("--");

    res = getResults([
      {foo: 1, bar: 2},
      {foo: "<AVG>", bar: "<SUM>"}
    ]);
    expect(res.avg).toEqual(1);
    expect(res.sum).toEqual(2);

    res = getResults([
      {foo: 1, bar: 2},
      {foo: 3, bar: 4},
      {foo: "<AVG>", bar: "<SUM>"}
    ]);
    expect(res.avg).toEqual(2);
    expect(res.sum).toEqual(6);

    res = getResults([
      {foo: 1, bar: 2},
      {foo: "wrong value, should be ignored", bar: "wrong value, should be ignored"},
      {foo: 3, bar: 4},
      {foo: "<AVG>", bar: "<SUM>"},
    ]);
    expect(res.avg).toEqual(2);
    expect(res.sum).toEqual(6);
  });
});
