import { getSaveExperimentRunUrl, createCodeForExperimentRun, getSaveExperimentRunUrlForCode, getExperimentPhoto } from "./api";

const mockFetch = (result: any) => {
  const fetchMock = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({ success: true, result })
  }));
  (window as any).fetch = fetchMock;
};

describe("api", () => {
  it("supports getSaveExperimentRunUrl", () => {
    const result = getSaveExperimentRunUrl("test", {foo: "bar"});
    expect(result).toEqual("https://us-central1-vortex-e5d5d.cloudfunctions.net/saveExperimentRun?runKey=test&runData=eyJmb28iOiJiYXIifQ==");
  });

  it("supports createCodeForExperimentRun", () => {
    const code = "123456789";
    mockFetch({ code });
    return createCodeForExperimentRun("test", {foo: "bar"})
      .then(result => expect(result).toEqual(code))
    ;
  });

  it("supports getSaveExperimentRunUrlForCode", () => {
    const url = "https://example.com/saveExperimentRun?runKey=test&runData=eyJmb28iOiJiYXIifQ==";
    mockFetch({ url });
    return getSaveExperimentRunUrlForCode("123456789")
      .then(result => expect(result).toEqual(url))
    ;
  });

  it("supports getExperimentPhoto", () => {
    const src = "https://example.com/image.jpg";
    mockFetch(src);
    return getExperimentPhoto(src)
      .then(result => expect(result).toEqual(src))
    ;
  });

});


