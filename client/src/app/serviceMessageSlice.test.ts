/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import reducer, { showServiceMessage, clearToast } from "./serviceMessageSlice";
import { INITIALIZED_TOAST } from "../../../src/Constants";

describe("serviceMessageSlice", () => {
  const initial = reducer(undefined, { type: "@@INIT" });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initial state is the initialized toast", () => {
    expect(initial.toast).toEqual(INITIALIZED_TOAST);
  });

  it("showServiceMessage - object payload sets detail with time and a timestamp", () => {
    const state = reducer(
      initial,
      showServiceMessage({
        ...INITIALIZED_TOAST,
        severity: "error",
        detail: "something failed",
      })
    );
    expect(state.toast.severity).toEqual("error");
    expect(state.toast.detail).toMatch(/^something failed \(.+\)$/);
    expect(state.toast.timestamp).toBeGreaterThan(0);
  });

  it("showServiceMessage - non object payload is ignored and logged", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const state = reducer(initial, showServiceMessage("not an object" as never));
    expect(state.toast).toEqual(initial.toast);
    expect(consoleError).toHaveBeenCalled();
  });

  it("clearToast - marks the toast as empty with a new timestamp", () => {
    const state = reducer(initial, clearToast());
    expect(state.toast.empty).toBeTruthy();
    expect(state.toast.timestamp).toBeGreaterThan(0);
  });
});
