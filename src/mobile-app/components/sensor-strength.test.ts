import { getStrength } from "./sensor-strength";

describe("SensorStrength component", () => {
  it("calculates the 0 to 100 strength from the -30 dBM to -60 dBM rssi value", () => {
    // in range...
    expect(getStrength(-30)).toBe(100);
    expect(getStrength(-45)).toBe(75);
    expect(getStrength(-60)).toBe(50);
    expect(getStrength(-75)).toBe(25);
    expect(getStrength(-90)).toBe(0);

    // out of range
    expect(getStrength(30)).toBe(100);
    expect(getStrength(0)).toBe(100);
    expect(getStrength(-29)).toBe(100);
    expect(getStrength(-91)).toBe(0);
    expect(getStrength(-991)).toBe(0);
  })
});