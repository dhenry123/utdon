/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createSlice } from "@reduxjs/toolkit";
import languageFr from "../../../locales/fr.json";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import {
  contextSliceType,
  DisplayControlsType,
} from "../../../src/Global.types";

const initialState: contextSliceType = {
  // French is default language
  language: { locale: "fr", lang: languageFr },
  application: {
    name: "UTdOn",
    applicationtitle: "UtDon",
    copyright: "December 2023",
    licence: "AGPL-3.0",
  },
  uptodateForm: INITIALIZED_UPTODATEFORM,
  refetchuptodateForm: false,
  isAdmin: false,
  search: "",
  isLoaderShip: false,
  displayControlsType: localStorage.getItem(
    "displayControlsAsList"
  ) as DisplayControlsType,
};

export const contextSlice = createSlice({
  name: "context",
  initialState,
  reducers: {
    setLanguage: (state, value) => {
      if (value.payload === "fr") {
        state.language.locale = value.payload;
        state.language.lang = languageFr;
      } else {
        //default is en
        state.language.locale = "en";
        state.language.lang = {};
      }
    },
    updateKeyUptodateFrom(state, value) {
      if (value.payload.key)
        state.uptodateForm = {
          ...state.uptodateForm,
          [value.payload.key]: value.payload.value,
        };
    },
    setUpdateForm(state, value) {
      state.uptodateForm = value.payload;
    },
    resetUpdateForm(state) {
      state.uptodateForm = INITIALIZED_UPTODATEFORM;
    },
    setRefetchuptodateForm(state, value) {
      state.refetchuptodateForm = value.payload;
    },
    setIsAdmin(state, value) {
      state.isAdmin = value.payload || false;
    },
    setSearch(state, value) {
      state.search = value.payload;
    },
    setIsLoaderShip(state, value) {
      state.isLoaderShip = value.payload;
    },
    setDisplayControlsAsList(state, value) {
      localStorage.setItem("displayControlsAsList", value.payload);
      state.displayControlsType = value.payload;
    },
  },
});

// Exportable actions
export const {
  setLanguage,
  updateKeyUptodateFrom,
  resetUpdateForm,
  setUpdateForm,
  setRefetchuptodateForm,
  setIsAdmin,
  setSearch,
  setIsLoaderShip,
  setDisplayControlsAsList,
} = contextSlice.actions;
export default contextSlice.reducer;
