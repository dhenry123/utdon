/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */
import { render, RenderOptions } from "@testing-library/react";
import { PropsWithChildren } from "react";
import { IntlProvider } from "react-intl";

/**
 * The app renders English by using the message id itself as the text
 * (the en catalog is empty), so tests assert against the raw ids.
 */
const IntlWrapper = ({ children }: PropsWithChildren) => (
  <IntlProvider locale="en" onError={() => {}}>
    {children}
  </IntlProvider>
);

export const renderWithIntl = (
  ui: JSX.Element,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: IntlWrapper, ...options });

/** minimal IntlShape for helpers that only use formatMessage */
export const intlStub = {
  locale: "en",
  formatMessage: ({ id }: { id: string }) => id,
} as never;
