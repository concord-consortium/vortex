import React from "react";
import { tableKeyboardNav } from "./table-keyboard-nav";
import { mount } from "enzyme";

describe("TableKeyboardNav helper", () => {
  // 3x3 table, middle input is disabled
  const TestTable = () => (
    <table onKeyDown={tableKeyboardNav}>
      <tbody>
        <tr><td><input id="1"/></td><td><input id="2"/></td><td><input id="3"/></td></tr>
        <tr><td><input id="4"/></td><td><input id="5" disabled={true}/></td><td><input id="6"/></td></tr>
        <tr><td><input id="7"/></td><td><input id="8"/></td><td><input id="9"/></td></tr>
      </tbody>
    </table>
  );

  it("should change focus on key down", () => {
    const wrapper = mount(<TestTable/>);
    expect(wrapper.find("table").length).toEqual(1);
    const table = wrapper.find("table").at(0);
    const inputs = wrapper.find("input");
    expect(inputs.length).toEqual(9);
    expect(document.activeElement).toEqual(document.body);
    const firstInput = inputs.at(0).getDOMNode();
    (firstInput as HTMLInputElement).focus();

    expect(document.activeElement?.id).toEqual("1");
    table.simulate("keydown", { key: "ArrowDown", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("4");
    table.simulate("keydown", { key: "ArrowRight", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("6"); // jump over disabled input
    table.simulate("keydown", { key: "ArrowRight", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("6"); // can't go more right
    table.simulate("keydown", { key: "ArrowUp", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("3");
    table.simulate("keydown", { key: "ArrowUp", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("3"); // can't go any higher
    table.simulate("keydown", { key: "ArrowLeft", target: document.activeElement });
    expect(document.activeElement?.id).toEqual("2");
  });
});
