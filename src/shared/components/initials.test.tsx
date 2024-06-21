import React from "react";
import { shallow } from "enzyme";
import { Initials } from "./initials";
import { IExperimentMetadata } from "../experiment-types";

describe("Initials component", () => {
  it("renders provided text", () => {
    const metadata: IExperimentMetadata = {
      uuid: "test",
      name: "Test",
      initials: "TT",
      iconColor: "#000",
      iconHoverColor: "#777",
    };
    const wrapper = shallow(<Initials metadata={metadata} />);
    expect(wrapper.text()).toEqual("TT");
  });
});
