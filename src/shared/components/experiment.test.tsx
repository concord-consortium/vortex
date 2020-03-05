import React from "react";
import { Experiment } from "./experiment";
import { mount, shallow } from "enzyme";
import Form from "react-jsonschema-form";
import { IExperiment, EXPERIMENT_VERSION_1, IExperimentConfig } from "../experiment-types";
import { act } from "react-dom/test-utils";
import { SectionButton } from "./section-button";
import { Section } from "./section";

jest.mock("react-jsonschema-form");

describe("Experiment component", () => {
  const defConfig: IExperimentConfig = {hideLabels: false, useSensors: false, showEditSaveButton: false};
  const defExperiment = {
    version: EXPERIMENT_VERSION_1,
    metadata: {
      uuid: "123",
      name: "test",
      initials: "tt",
    },
    schema: {
      sections: [{
        title: "Foo section",
        icon: "icon",
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
    const wrapper = mount(<Experiment experiment={defExperiment} config={defConfig} onDataChange={onDataChange} />);
    const form = wrapper.find(Form).instance();
    expect(form).toBeDefined();
    const newData = { foo: "test" };
    act(() => {
      // Mocked form, see __mocks__ dir.
      (form as any).triggerChange(newData);
      expect(onDataChange).toHaveBeenCalledWith(newData);
    });
  });

  it("renders section buttons and marks the first one as active", () => {
    const onDataChange = jest.fn();
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
          icon: "icon1",
          formFields: []
        }, {
          title: "Bar section",
          icon: "icon2",
          formFields: []
        }],
        dataSchema: {
          type: "object",
          properties: {
          }
        }
      }
    } as IExperiment;
    const wrapper = shallow(<Experiment experiment={experiment} config={defConfig} onDataChange={onDataChange} />);
    expect(wrapper.find(SectionButton).length).toEqual(2);
    const sectionBtn1 = wrapper.find(SectionButton).get(0);
    const sectionBtn2 = wrapper.find(SectionButton).get(1);
    expect(sectionBtn1.props.title).toEqual("Foo section");
    expect(sectionBtn1.props.icon).toEqual("icon1");
    expect(sectionBtn1.props.active).toEqual(true); // first section is active on initial render
    expect(sectionBtn2.props.title).toEqual("Bar section");
    expect(sectionBtn2.props.icon).toEqual("icon2");
    expect(sectionBtn2.props.active).toEqual(false);
  });

  it("renders first section on initial render and lets user change it using section buttons", () => {
    const onDataChange = jest.fn();
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
          icon: "icon1",
          formFields: []
        }, {
          title: "Bar section",
          icon: "icon2",
          formFields: []
        }],
        dataSchema: {
          type: "object",
          properties: {
          }
        }
      }
    } as IExperiment;
    const wrapper = shallow(<Experiment experiment={experiment} config={defConfig} onDataChange={onDataChange} />);
    expect(wrapper.find(Section).length).toEqual(1);
    const section = wrapper.find(Section).get(0);
    expect(section.props.section).toEqual({
      title: "Foo section",
      icon: "icon1",
      formFields: []
    });

    wrapper.find(SectionButton).at(1).simulate("click");
    const newSection = wrapper.find(Section).get(0);
    expect(newSection.props.section).toEqual({
      title: "Bar section",
      icon: "icon2",
      formFields: []
    });
  });

  it("renders optional defaultSectionIndex on initial render", () => {
    const onDataChange = jest.fn();
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
          icon: "icon1",
          formFields: []
        }, {
          title: "Bar section",
          icon: "icon2",
          formFields: []
        }],
        dataSchema: {
          type: "object",
          properties: {
          }
        }
      }
    } as IExperiment;
    const wrapper = shallow(<Experiment experiment={experiment} config={defConfig} onDataChange={onDataChange} defaultSectionIndex={1} />);
    expect(wrapper.find(Section).length).toEqual(1);
    const section = wrapper.find(Section).get(0);
    expect(section.props.section).toEqual({
      title: "Bar section",
      icon: "icon2",
      formFields: []
    });
  });

});
