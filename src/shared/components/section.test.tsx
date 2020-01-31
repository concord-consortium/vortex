import React from "react";
import { Section } from "./section";
import { mount } from "enzyme";
import Form from "react-jsonschema-form";
import { IDataSchema } from "../experiment-types";

jest.mock("react-jsonschema-form");

describe("Section component", () => {
  const dataSchema = {
    type: "object",
    properties: {
      foo: {
        type: "string"
      },
      bar: {
        type: "number"
      }
    }
  } as IDataSchema;
  const section = {
    title: "Foo section",
    icon: "test",
    formFields: ["foo"]
  };

  it("immediately notifies parent when form is updated by the user", () => {
    const onDataChange = jest.fn();
    const wrapper = mount(<Section dataSchema={dataSchema} section={section} formData={{timestamp: Date.now()}} onDataChange={onDataChange} />);
    const form = wrapper.find(Form).instance();
    expect(form).toBeDefined();
    const newData = { foo: "test" };
    // Mocked form, see __mocks__ dir.
    (form as any).triggerChange(newData);
    expect(onDataChange).toHaveBeenCalledWith(newData);
  });
});
