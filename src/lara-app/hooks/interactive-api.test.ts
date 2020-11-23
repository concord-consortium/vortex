import { isGetFirebaseJwtSupported } from "./interactive-api";
import { IInitInteractive } from "@concord-consortium/lara-interactive-api";

describe("isGetFirebaseJwtSupported", () => {
  it("returns true when init message hostFeatures provides supported version", () => {
    expect(isGetFirebaseJwtSupported(
      { mode: "runtime", hostFeatures: { getFirebaseJwt: { version: "1.0.0" } } } as unknown as IInitInteractive
    )).toEqual(true);
    expect(isGetFirebaseJwtSupported(
      { mode: "runtime", hostFeatures: { getFirebaseJwt: { version: "1.0.1" } } } as unknown as IInitInteractive
    )).toEqual(true);
    expect(isGetFirebaseJwtSupported(
      { mode: "runtime", hostFeatures: { getFirebaseJwt: { version: "1.1.1" } } } as unknown as IInitInteractive
    )).toEqual(true);

    expect(isGetFirebaseJwtSupported(
      { mode: "runtime", hostFeatures: { getFirebaseJwt: { version: "2.0.0" } } } as unknown as IInitInteractive
    )).toEqual(false);
    expect(isGetFirebaseJwtSupported(
      { mode: "runtime", hostFeatures: {} } as unknown as IInitInteractive
    )).toEqual(false);
  });
})
