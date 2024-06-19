import React from "react";
import { shallow } from "enzyme";
import { Metadata } from "./metadata";
import { EXPERIMENT_VERSION_1, IExperiment } from "../experiment-types";
import { Initials } from "./initials";

describe("Metadata component", () => {
  it("renders initials, experiment name and timestamp", () => {
    const experiment = {
      version: EXPERIMENT_VERSION_1,
      metadata: {
        uuid: "123",
        name: "test experiment",
        initials: "tt",
        iconColor: "#000",
        iconHoverColor: "#777"
      },
      schema: {
        sections: [],
        dataSchema: {
          type: "object",
          properties: {
            foo: {
              type: "string"
            }
          }
        }
      }
    } as IExperiment;
    const data = {
      timestamp: 1581082141929
    };
    const wrapper = shallow(<Metadata experiment={experiment} data={data}/>);
    expect(wrapper.find(Initials).length).toEqual(1);
    expect(wrapper.text()).toEqual(expect.stringContaining("test experiment"));
    expect(wrapper.text()).toEqual(expect.stringMatching(/Fri, February 7, 2020/));
  });
});
