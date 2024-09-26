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
  headerkeyField: UptodateFormFields;
  headervalueField: UptodateFormFields;
}
export const HttpHeader = ({
  handleOnChange,
  headerkeyField,
  headervalueField,
  headerkey,
  headervalue,
}: HttpHeaderProps) => {
  const intl = useIntl();

  return (
    <FieldSet
      legend={intl.formatMessage({ id: "HTTP Header" })}
      className="HttpHeader"
      toolTipContent={`${intl.formatMessage({
        id: "(Optional) HTTP Header, use when authentication with token is needed",
      })}
              ${intl.formatMessage({ id: "eg" })}:
              - ${intl.formatMessage({
                id: "Attribute: Authorization ; value: Bearer myauthtoken",
              })}
              - ${intl.formatMessage({
                id: "Attribute: X-Auth ; value: myauthtoken",
              })}
              - ${intl.formatMessage({
                id: "For Github => Attribute: Authorization ; value: Bearer [your github token]",
              })} (${intl.formatMessage({ id: "Bearer is important" })})
              `}
    >
      <InputGeneric
        className="headerhttpkey"
        value={headerkey}
        placeholder={intl.formatMessage({ id: "HTTP header attribute" })}
        title={intl.formatMessage({ id: "HTTP header attribut" })}
        onChange={(value: string) => handleOnChange(headerkeyField, value)}
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
        onChange={(value: string) => handleOnChange(headervalueField, value)}
      />
    </FieldSet>
  );
};
