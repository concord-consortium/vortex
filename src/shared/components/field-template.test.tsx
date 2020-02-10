import React from "react";
import { FieldTemplateProps } from "react-jsonschema-form";
import { shallow } from "enzyme";
import { FieldTemplate } from "./field-template";
import { Icon } from "./icon";

describe("FieldTemplate component", () => {
  const defProps: FieldTemplateProps = {
    id: "test-id",
    classNames: "",
    label: "",
    description: <div id="description"/>,
    rawDescription: "",
    children: <div>Children</div>,
    errors: <div/>,
    rawErrors: [],
    help: <div id="help"/>,
    rawHelp: "",
    hidden: false,
    required: false,
    readonly: false,
    disabled: false,
    displayLabel: true,
    fields: [],
    schema: {},
    uiSchema: {},
    formContext: {}
  };

  it("renders children, label, description and help", () => {
    const wrapper = shallow(<FieldTemplate {...defProps} label="Test label"><input id="test-input" /></FieldTemplate>);
    expect(wrapper.find("#test-input").length).toEqual(1);
    expect(wrapper.find("#description").length).toEqual(1);
    expect(wrapper.find("#help").length).toEqual(1);
    expect(wrapper.find("label").length).toEqual(1);
    expect(wrapper.find("label").text()).toEqual("Test label");
  });

  it("renders icon if it's specified", () => {
    const wrapper = shallow(<FieldTemplate  {...defProps} uiSchema={{"ui:icon": "label"}}><input id="test-input" /></FieldTemplate>);
    expect(wrapper.find(Icon).length).toEqual(1);
    expect(wrapper.find({name: "label"}).length).toEqual(1);
  });

  it("hides label when placeholder is specified experimentConfig.hideLabels=true", () => {
    let wrapper = shallow(<FieldTemplate  {...defProps} uiSchema={{"ui:placeholder": "Placeholder"}}><input id="test-input" /></FieldTemplate>);
    // Missing experimentConfig, label still rendered.
    expect(wrapper.find("label").length).toEqual(1);
    wrapper = shallow(<FieldTemplate  {...defProps} formContext={{experimentConfig: {hideLabels: true}}}><input id="test-input" /></FieldTemplate>);
    // Missing placeholder, label still rendered.
    expect(wrapper.find("label").length).toEqual(1);
    wrapper = shallow(<FieldTemplate  {...defProps} uiSchema={{"ui:placeholder": "Placeholder"}} formContext={{experimentConfig: {hideLabels: true}}}><input id="test-input" /></FieldTemplate>);
    expect(wrapper.find("label").length).toEqual(0);
  });

  it("hides label when placeholder is specified experimentConfig.hideLabels=true", () => {
    let wrapper = shallow(<FieldTemplate  {...defProps} required={false}><input id="test-input" /></FieldTemplate>);
    expect(wrapper.find("[data-test='required']").length).toEqual(0);
    wrapper = shallow(<FieldTemplate  {...defProps} required={true}><input id="test-input" /></FieldTemplate>);
    expect(wrapper.find("[data-test='required']").length).toEqual(1);
  });
});
