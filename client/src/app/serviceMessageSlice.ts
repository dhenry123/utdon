/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { createSlice } from "@reduxjs/toolkit";
import { INITIALIZED_TOAST } from "../../../src/Constants";

const initialState = {
  toast: INITIALIZED_TOAST,
};

const formatDetail = (message: string) => {
  return message + " (" + new Date().toLocaleTimeString() + ")";
};

export const serviceMessageSlice = createSlice({
  name: "servicemessage",
  initialState,
  reducers: {
    /**
     * possibility to send message with full object or simply with only one string
     * @param {object} state
     * @param {object || string} value
     * @returns
     */
    showServiceMessage: (state, value) => {
      if (typeof value.payload === "object" && value.payload) {
        const newToast = { ...value.payload };
        newToast.detail = formatDetail(newToast.detail);
        // timestamp must be set here to apply changes on toast timestamp listen by serviceMessage
        newToast.timestamp = new Date().valueOf();
        state.toast = newToast;
      } else {
        console.error("toast is not Object");
      }
    },
    /**
     * send signal to clear visually all toasts
     * @param state
     */
    clearToast: (state) => {
      const newToast = { ...INITIALIZED_TOAST, empty: true };
      newToast.timestamp = new Date().valueOf();
      state.toast = newToast;
    },
  },
});

// Exportable actions
export const { showServiceMessage, clearToast } = serviceMessageSlice.actions;
export default serviceMessageSlice.reducer;
