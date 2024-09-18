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
import { setIsLoaderShip, setLanguage } from "./app/contextSlice";
import { Dialog } from "./components/Dialog";

import "./app/css/loadership.scss";

export const App = () => {
  const dispatch = useAppDispatch();
  const contextLanguage = useAppSelector((state) => state.context.language);

  const isDialogVisible = useAppSelector((state) => state.context.isLoaderShip);

  useEffect(() => {
    // Browser language detection
    const navigatorLocale =
      navigator.language.split("-")[0].toLowerCase() !== "fr" ? "en" : "fr";
    dispatch(setLanguage(navigatorLocale));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <IntlProvider
        locale={contextLanguage.locale}
        messages={contextLanguage.lang}
        onError={() => {}}
      >
        {/* Route change in regard the value of "contextIsLogged" */}
        <RouterProvider router={Router()} />
        {/* Global Service Messenger */}
        <ServiceMessage />
        <Dialog
          className="loadership_Dialog"
          visible={isDialogVisible}
          onHide={() => dispatch(setIsLoaderShip(false))}
          sticky={true}
        >
          <div className="loadership_ILQMG">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </Dialog>
      </IntlProvider>
    </div>
  );
};
