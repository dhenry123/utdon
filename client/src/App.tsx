/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

// icons
import "@tabler/icons-webfont/tabler-icons.min.css";

import { useAppSelector } from "./app/hook";
import { IntlProvider } from "react-intl";
import ServiceMessage from "./components/ServiceMessage";
import { RouterProvider } from "react-router-dom";
import { Router } from "./app/Router";

export const App = () => {
  const contextLanguage = useAppSelector((state) => state.context.language);

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
