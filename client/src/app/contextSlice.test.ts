/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { describe, it, expect } from "vitest";
import reducer, {
  setLanguage,
  updateKeyUptodateFrom,
  setUpdateForm,
  resetUpdateForm,
  setRefetchuptodateForm,
  setIsAdmin,
  setSearch,
  setIsLoaderShip,
  setDisplayControlsAsList,
  setAuthToken,
} from "./contextSlice";
import languageFr from "../../../locales/fr.json";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";

describe("contextSlice", () => {
  const initial = reducer(undefined, { type: "@@INIT" });

  it("initial state", () => {
    expect(initial.language.locale).toEqual("fr");
    expect(initial.uptodateForm).toEqual(INITIALIZED_UPTODATEFORM);
    expect(initial.isAdmin).toBeFalsy();
    expect(initial.search).toEqual("");
    expect(initial.isLoaderShip).toBeFalsy();
    expect(initial.authToken).toEqual("");
  });

  it("setLanguage - fr loads the french catalog", () => {
    const state = reducer(initial, setLanguage("fr"));
    expect(state.language.locale).toEqual("fr");
    expect(state.language.lang).toEqual(languageFr);
  });

  it("setLanguage - anything else falls back to en with empty catalog", () => {
    const state = reducer(initial, setLanguage("de"));
    expect(state.language.locale).toEqual("en");
    expect(state.language.lang).toEqual({});
  });

  it("updateKeyUptodateFrom - sets one form key", () => {
    const state = reducer(
      initial,
      updateKeyUptodateFrom({ key: "name", value: "mycontrol" })
    );
    expect(state.uptodateForm.name).toEqual("mycontrol");
    // other keys untouched
    expect(state.uptodateForm.urlGitHub).toEqual(
      INITIALIZED_UPTODATEFORM.urlGitHub
    );
  });

  it("setUpdateForm / resetUpdateForm", () => {
    const form = { ...INITIALIZED_UPTODATEFORM, name: "another" };
    const changed = reducer(initial, setUpdateForm(form));
    expect(changed.uptodateForm.name).toEqual("another");
    const reset = reducer(changed, resetUpdateForm());
    expect(reset.uptodateForm).toEqual(INITIALIZED_UPTODATEFORM);
  });

  it("setRefetchuptodateForm / setSearch / setIsLoaderShip / setAuthToken", () => {
    let state = reducer(initial, setRefetchuptodateForm(true));
    expect(state.refetchuptodateForm).toBeTruthy();
    state = reducer(state, setSearch("immich"));
    expect(state.search).toEqual("immich");
    state = reducer(state, setIsLoaderShip(true));
    expect(state.isLoaderShip).toBeTruthy();
    state = reducer(state, setAuthToken("token-value"));
    expect(state.authToken).toEqual("token-value");
  });

  it("setIsAdmin - falsy payload stays false", () => {
    expect(reducer(initial, setIsAdmin(undefined as never)).isAdmin).toBeFalsy();
    expect(reducer(initial, setIsAdmin(true)).isAdmin).toBeTruthy();
  });

  it("setDisplayControlsAsList - persists to localStorage", () => {
    const state = reducer(initial, setDisplayControlsAsList("table"));
    expect(state.displayControlsType).toEqual("table");
    expect(localStorage.getItem("displayControlsAsList")).toEqual("table");
  });
});
