/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./HttpHeader.scss";
import { FieldSet } from "./FieldSet";
import InputGeneric from "./InputGeneric";
import { UptodateFormFields } from "../../../src/Global.types";
interface HttpHeaderProps {
  handleOnChange: (key: UptodateFormFields, value: string | string[]) => void;
  headerkey: string;
  headervalue: string;
}
export const HttpHeader = ({
  handleOnChange,
  headerkey,
  headervalue,
}: HttpHeaderProps) => {
  const intl = useIntl();

  return (
    <div className={`HttpHeader`}>
      <FieldSet
        legend={intl.formatMessage({ id: "HTTP Header" })}
        className="headershttp"
        toolTipContent={`${intl.formatMessage({
          id: "(Optional) HTTP Header, use when authentication with token is needed",
        })}
              ${intl.formatMessage({ id: "eg" })}:
              - ${intl.formatMessage({
                id: "Attribut: Authorization ; value: Bearer myauthtoken",
              })}
              - ${intl.formatMessage({
                id: "Attribut: X-Auth ; value: myauthtoken",
              })}

              `}
      >
        <InputGeneric
          className="headerhttpkey"
          value={headerkey}
          placeholder={intl.formatMessage({ id: "HTTP header attribut" })}
          title={intl.formatMessage({ id: "HTTP header attribut" })}
          onChange={(value: string) => handleOnChange("headerkey", value)}
        />
        <InputGeneric
          className="headerhttpvalue"
          placeholder={intl.formatMessage({
            id: "HTTP header attribute value",
          })}
          title={intl.formatMessage({
            id: "HTTP header attribute value",
          })}
          value={headervalue}
          onChange={(value: string) => handleOnChange("headervalue", value)}
        />
      </FieldSet>
    </div>
  );
};
