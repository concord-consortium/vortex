import { IRun, useRuns } from "./use-runs";
import { renderHook, act } from "@testing-library/react-hooks";
import { IExperiment, IExperimentData } from "../../shared/experiment-types";

describe("use-runs hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // We don't care about experiment content in these tests.
  const testExperiment = {
    metadata: {
      name: "test"
    }
  } as any as IExperiment;
  const testData = { testData: 123 } as any as IExperimentData;

  it("returns empty list of runs if there's no saved data in local storage", () => {
    const { result } = renderHook(() => useRuns());
    expect(result.current.runs).toEqual([]);
    expect(result.current.activeRun).toEqual(null);
  });

  it("returns previously added runs", () => {
    const { result } = renderHook(() => useRuns());
    let run1;
    act(() => {
      run1 = result.current.startNewRun(testExperiment);
    });
    expect(result.current.runs.length).toBe(1);
    expect(result.current.activeRun).toBe(run1);
    let run2;
    act(() => {
      run2 = result.current.startNewRun(testExperiment);
    });
    expect(result.current.activeRun).toBe(run2);
    expect(result.current.runs.length).toBe(2);
    expect(result.current.runs[0]).toEqual(run1);
    expect(result.current.runs[1]).toEqual(run2);
  });

  it("saves experiment run data", () => {
    const { result } = renderHook(() => useRuns());
    let run;
    act(() => {
      run = result.current.startNewRun(testExperiment);
    });
    expect(result.current.activeRun).toEqual(run);
    act(() => {
      result.current.saveActiveRunData(testData);
    });
    expect(result.current.runs.length).toEqual(1);
    expect(result.current.activeRun!.data).toEqual(testData);
    expect(result.current.runs[0].data).toEqual(testData);
  });

  it("provides a way to change active run", () => {
    const { result } = renderHook(() => useRuns());
    let run1: IRun | null = null;
    act(() => {
      run1 = result.current.startNewRun(testExperiment);
    });
    expect(result.current.activeRun).toEqual(run1);
    let run2;
    act(() => {
      run2 = result.current.startNewRun(testExperiment);
    });
    expect(result.current.activeRun).toEqual(run2);
    act(() => {
      result.current.setActiveRun(run1);
    });
    expect(result.current.activeRun).toEqual(run1);
    act(() => {
      result.current.setActiveRun(null);
    });
    expect(result.current.activeRun).toEqual(null);
  });

  it("resets runs", () => {
    const { result } = renderHook(() => useRuns());
    let run1;
    act(() => {
      run1 = result.current.startNewRun(testExperiment);
    });
    expect(result.current.runs.length).toEqual(1);
    act(() => {
      run1 = result.current.resetRuns();
    });
    expect(result.current.runs.length).toEqual(0);
  });
});
