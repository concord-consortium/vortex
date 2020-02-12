import { delayPromise } from "./delay-promise";

describe("delayPromise", () => {
  it("returns a promise that resolves to the value after a delay", async () => {
    const delay = 20;
    const before = Date.now();
    const result = await delayPromise(delay, "foo");
    const after = Date.now();
    expect(result).toBe("foo");
    // don't text exact time but +/- 10%
    expect(after - before).toBeGreaterThanOrEqual(delay - (delay * 0.1));
  });
});