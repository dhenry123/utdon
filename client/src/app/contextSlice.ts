/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createSlice } from "@reduxjs/toolkit";
import languageFr from "../../../locales/fr.json";
import { INITIALIZED_UPTODATEFORM } from "../../../src/Constants";
import { contextSliceType } from "../../../src/Global.types";

const initialState: contextSliceType = {
  // French is default language
  language: { locale: "fr", lang: languageFr },
  user: { login: "", bearer: "", uuid: "" },
  application: {
    name: "UTdOn",
    applicationtitle: "UtDon",
    copyrightts: "December 2023",
    licence: "AGPL-3.0",
  },
  uptodateForm: INITIALIZED_UPTODATEFORM,
  refetchuptodateForm: false,
  isAdmin: false,
};

export const contextSlice = createSlice({
  name: "context",
  initialState,
  reducers: {
    setUser: (state, value) => {
      state.user = value.payload;
    },
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
  },
});

// Exportable actions
export const {
  setLanguage,
  setUser,
  updateKeyUptodateFrom,
  resetUpdateForm,
  setUpdateForm,
  setRefetchuptodateForm,
  setIsAdmin,
} = contextSlice.actions;
export default contextSlice.reducer;
