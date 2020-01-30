import { IRun, useRuns } from "./use-runs";
import { testHook, getHookWrapper } from "../../shared/test/test-hook";
import { act } from "react-dom/test-utils";

describe("use-runs hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty list of runs if there's no saved data in local storage", () => {
    const { runs } = testHook(() => useRuns());
    expect(runs).toEqual([]);
  });

  it("returns previously added runs", () => {
    const wrapper = getHookWrapper(() => useRuns());
    let results = wrapper.executeHook();
    let run1;
    act(() => {
      run1 = results.addNewRun({ testExperiment: "A" });
    });
    results = wrapper.executeHook();
    let run2;
    act(() => {
      run2 = results.addNewRun({ testExperiment: "B" });
    });
    results = wrapper.executeHook();
    expect(results.runs.length).toEqual(2);
    expect(results.runs[0]).toEqual(run1);
    expect(results.runs[1]).toEqual(run2);
  });

  it("saves experiment run data", () => {
    const wrapper = getHookWrapper(() => useRuns());
    let results = wrapper.executeHook();
    let run: IRun;
    act(() => {
      run = results.addNewRun();
    });
    results = wrapper.executeHook();
    act(() => {
      results.saveRunData(run.key, { testData: 123 });
    });
    results = wrapper.executeHook();
    expect(results.runs.length).toEqual(1);
    expect(results.runs[0].data).toEqual({ testData: 123 });
  });

  it("resets runs", () => {
    const wrapper = getHookWrapper(() => useRuns());
    let results = wrapper.executeHook();
    let run1;
    act(() => {
      run1 = results.addNewRun({ testExperiment: "A" });
    });
    results = wrapper.executeHook();
    expect(results.runs.length).toEqual(1);
    act(() => {
      run1 = results.resetRuns();
    });
    results = wrapper.executeHook();
    expect(results.runs.length).toEqual(0);
  });
});
