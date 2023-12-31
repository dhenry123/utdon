/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

// icons
import "@tabler/icons-webfont/tabler-icons.min.css";

import { useAppDispatch, useAppSelector } from "./app/hook";
import { IntlProvider } from "react-intl";
import ServiceMessage from "./components/ServiceMessage";
import { RouterProvider } from "react-router-dom";
import { Router } from "./app/Router";
import { useEffect } from "react";
import { setLanguage } from "./app/contextSlice";

export const App = () => {
  const dispatch = useAppDispatch();
  const contextLanguage = useAppSelector((state) => state.context.language);

  useEffect(() => {
    // Browser language detection
    const navigatorLocale =
      navigator.language.split("-")[0].toLowerCase() !== "fr" ? "en" : "fr";
    console.log("navigator", navigatorLocale);
    dispatch(setLanguage(navigatorLocale));
  }, []);

  return (
    <div className="main">
      <IntlProvider
        locale={contextLanguage.locale}
        messages={contextLanguage.lang}
        onError={() => {}}
      >
        {/* Route change in regard the value of "contextIsLogged" */}
        <RouterProvider router={Router()} />
        {/* Global Service Messenger */}
        <ServiceMessage />
      </IntlProvider>
    </div>
  );
};
