/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useRouteError, ErrorResponse } from "react-router-dom";
import "./ErrorInRouter.scss";
import { useIntl } from "react-intl";

export const ErrorInRouter = () => {
  const intl = useIntl();
  const error = useRouteError() as ErrorResponse;
  return (
    <div className="ErrorInRouter">
      <h1>Oops!</h1>
      <p>
        {" "}
        {intl.formatMessage({ id: "Sorry, an unexpected error has occurred" })}.
      </p>
      <p>
        <i>
          {error.status} - {error.statusText} - {error.data}
        </i>
      </p>
      <a href="/">{intl.formatMessage({ id: "Return to the homepage" })}</a>
    </div>
  );
};
