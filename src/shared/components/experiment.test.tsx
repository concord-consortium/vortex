import React from "react";
import { Experiment } from "./experiment";
import { mount } from "enzyme";
import Form from "react-jsonschema-form";
import { IExperiment, EXPERIMENT_VERSION_1 } from "../experiment-types";
import { act } from "react-dom/test-utils";

jest.mock("react-jsonschema-form");

describe("Experiment component", () => {
  const experiment = {
    version: EXPERIMENT_VERSION_1,
    metadata: {
      uuid: "123",
      name: "test",
      initials: "tt",
    },
    schema: {
      sections: [{
        title: "Foo section",
        formFields: ["foo"]
      }],
      dataSchema: {
        type: "object",
        properties: {
          foo: {
            type: "string"
          },
          bar: {
            type: "number"
          }
        }
      }
    }
  } as IExperiment;

  it("immediately notifies parent when form is updated by the user", () => {
    // This is somehow redundant to similar Section component tests,
    // but it won't hurt and quite important to ensure that data is not lost.
    const onDataChange = jest.fn();
    const wrapper = mount(<Experiment experiment={experiment} onDataChange={onDataChange} />);
    const form = wrapper.find(Form).instance();
    expect(form).toBeDefined();
    const newData = { foo: "test" };
    act(() => {
      // Mocked form, see __mocks__ dir.
      (form as any).triggerChange(newData);
      expect(onDataChange).toHaveBeenCalledWith(newData);
    });
  });
});
