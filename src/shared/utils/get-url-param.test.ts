import { getURLParam } from "./get-url-param";

describe("getUrlParam", () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    (window as any).location = { href: "http://example.com/foo?bar=baz&boom" };
  });

  afterAll(() => {
    window.location = location;
  });

  it("returns null if the parameter doesn't exist", () => {
    expect(getURLParam("not_exist")).toBe(null);
  });

  it("returns true if the parameter doesn't have a value", () => {
    expect(getURLParam("boom")).toBe(true);
  });

  it("returns the value of the parameter", () => {
    expect(getURLParam("bar")).toBe("baz");
  });
});