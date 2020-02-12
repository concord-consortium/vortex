import { serializePromises } from "./serialize-promises";

describe("serializePromises", () => {
  it("acts the same as Promise.all", async () => {
    const promiseAll = await Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
    const serialize = await serializePromises([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]);
    expect(serialize).toEqual([1, 2, 3]);
    expect(promiseAll).toEqual(serialize);
  });

  it("allows for timeouts between promises", async () => {
    const delay = 10;
    const before = Date.now();
    const serialize = await serializePromises([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)], delay);
    const after = Date.now();
    expect(serialize).toEqual([1, 2, 3]);
    // don't text exact time but +/- 10%
    const duration = delay * serialize.length;
    expect(after - before).toBeGreaterThanOrEqual(duration - (duration * 0.1));
  });
});