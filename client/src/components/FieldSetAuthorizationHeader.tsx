/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch } from "../app/hook";

import "./FieldSetAuthorizationHeader.scss";
import { FieldSet } from "./FieldSet";
import { copyToClipboard } from "../helpers/UiMiscHelper";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { INITIALIZED_TOAST } from "../../../src/Constants";
import ButtonGeneric from "./ButtonGeneric";
import { useRef } from "react";

interface FieldSetAuthorizationHeaderProps {
  authToken: string;
}
export const FieldSetAuthorizationHeader = ({
  authToken,
}: FieldSetAuthorizationHeaderProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const divRef = useRef(null);

  const handleOnCopyToClipboard = async () => {
    copyToClipboard(divRef)
      .then(() => {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "info",
            detail: intl.formatMessage({
              id: "The command has been copied to Clipboard",
            }),
          })
        );
      })
      .catch((error: Error) => {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "error",
            detail: `Unexpected Error: ${error.toString()}`,
          })
        );
      });
  };

  return (
    <FieldSet
      legend={intl.formatMessage({ id: "HTTP authorization header" })}
      className={`FieldSetAuthorizationHeader`}
    >
      <div className="authToken">
        <div ref={divRef}>{`Authorization: ${authToken}`}</div>
        <ButtonGeneric
          className="copyToClipboard"
          onClick={handleOnCopyToClipboard}
          icon={"copy"}
          title={intl.formatMessage({
            id: "Copy authorization key to the clipboard",
          })}
        />
      </div>
    </FieldSet>
  );
};
