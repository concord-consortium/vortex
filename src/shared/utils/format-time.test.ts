import { formatTime } from "./format-time";

describe("format-time", () => {
  it("formats correctly", () => {
    // use regex to handle various time zones
    expect(formatTime(1581082141929)).toMatch(/Fri, February 7, 2020, \d?\d:29 [AP]M/);
  });
});
