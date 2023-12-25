/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import { store } from "./app/store";
import { Provider } from "react-redux";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
