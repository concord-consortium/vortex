import { formatTime } from "./format-time";

describe("format-time", () => {
  it("formats correctly", () => {
    // replace hour with X to remove timezone different from Travis servers
    expect(formatTime(1581082141929).replace("8:", "X:")).toBe("Fri, February 7, 2020, X:29 AM");
  });
});