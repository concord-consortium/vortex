import { formatTime } from "./format-time";

describe("format-time", () => {
  it("formats correctly", () => {
    expect(formatTime(1581082141929)).toBe("Fri, February 7, 2020, 8:29 AM");
  });
});