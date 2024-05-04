import type { Preview } from "@storybook/react";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { store } from "../src/app/store";
import French from "../../locales/fr.json";

// icons
import "@tabler/icons-webfont/tabler-icons.min.css";
import React from "react";

import "../src/app/css/root.scss";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <Provider store={store}>
        <IntlProvider locale="fr" messages={French} onError={() => {}}>
          <Story />
        </IntlProvider>
      </Provider>
    ),
  ],
};

export default preview;
