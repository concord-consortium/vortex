import React from "react";
import { shallow } from "enzyme";
import { Initials } from "./initials";

describe("Initials component", () => {
  it("renders provided text", () => {
    const wrapper = shallow(<Initials text="TT" />);
    expect(wrapper.text()).toEqual("TT");
  });
});
