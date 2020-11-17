import { handleSpecialValue } from "./handle-special-value";

describe("handleSpecialValue helper", () => {
  it("ignores regular numbers", () => {
    expect(handleSpecialValue(123, "testProp", [{testProp: 1}, {testProp: 2}])).toEqual(123);
    expect(handleSpecialValue("fooBar", "testProp", [{testProp: 1}, {testProp: 2}])).toEqual("fooBar");
  });

  it("handles function definitions, ignores undefined and string values", () => {
    expect(handleSpecialValue("<AVG>", "testProp", [
      {testProp: 1},
      {testProp: "ignoredValue"},
      {testProp: undefined},
      {testProp: 2, anotherProperty: 123},
      {},
    ])).toEqual(1.5); // (1 + 2) / 2

    expect(handleSpecialValue("<SUM>", "testProp", [
      {testProp: 1},
      {testProp: "ignoredValue"},
      {testProp: undefined},
      {testProp: 2, anotherProperty: 123},
      {},
    ])).toEqual(3); // 1 + 2

    expect(handleSpecialValue("<VAR>", "testProp", [
      {testProp: 1},
      {testProp: "ignoredValue"},
      {testProp: undefined},
      {testProp: 2, anotherProperty: 123},
      {},
    ])).toEqual(0.5);

    expect(handleSpecialValue("<STDDEV>", "testProp", [
      {testProp: 1},
      {testProp: "ignoredValue"},
      {testProp: undefined},
      {testProp: 2, anotherProperty: 123},
      {},
    ])).toEqual(0.71);

    expect(handleSpecialValue("<MEDIAN>", "testProp", [
      {testProp: 1},
      {testProp: "ignoredValue"},
      {testProp: undefined},
      {testProp: 2, anotherProperty: 123},
      {},
    ])).toEqual(1.5);
  });
});
