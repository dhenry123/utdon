/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import { useAppDispatch } from "../app/hook";

import "./FieldSetApiEntrypoint.scss";
import { FieldSet } from "./FieldSet";
import { INITIALIZED_TOAST } from "../../../src/Constants";
import { useRef, useState } from "react";
import ButtonGeneric from "./ButtonGeneric";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { CheckBox } from "./CheckBox";
import { copyToClipboard } from "../helpers/UiMiscHelper";

interface FieldSetApiEntrypointProps {
  className?: string;
  apiEntrypoint: string;
  method: string;
  commandTitle: string;
  body?: string;
  userAuthToken: string;
}
export const FieldSetApiEntrypoint = ({
  className,
  apiEntrypoint,
  method,
  commandTitle,
  body,
  userAuthToken,
}: FieldSetApiEntrypointProps) => {
  const intl = useIntl();

  const url = `${window.location.protocol}//${window.location.hostname}${
    window.location.port ? `:${window.location.port}` : ""
  }${apiEntrypoint}`;

  const [kParameter, setKParameter] = useState(false);
  const divRef = useRef(null);
  const dispatch = useAppDispatch();

  const [isChecked, setIsChecked] = useState(false);

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
      legend={intl.formatMessage({ id: commandTitle })}
      className={`FieldSetApiEntrypoint ${className ? className : ""}`}
    >
      <div className="method">{`Method : ${method}`}</div>
      <div className="url">{`Url : ${url}`}</div>

      <div className="curltitle">
        {intl.formatMessage({ id: "the curl command" })}:
      </div>
      <div className="curlcommand">
        <div className="command" ref={divRef}>
          {`curl -s ${kParameter ? "-k" : ""} ${
            method && method !== "GET" ? `-X ${method}` : ""
          } ${userAuthToken ? `-H "Authorization: ${userAuthToken}"` : ""} ${
            body ? `-H "Content-Type: application/json" --data '${body}'` : ""
          } ${url}`}
        </div>
        <ButtonGeneric
          className="copyToClipboard"
          onClick={handleOnCopyToClipboard}
          icon={"copy"}
          title={intl.formatMessage({ id: "Copy command to the clipboard" })}
        />
      </div>
      {/* if this server use https protocol with self-signed certificate, curl needs -k */}
      {window.location.protocol === "https:" ? (
        <CheckBox
          onChange={(event) => {
            // problem with re-renderer
            setKParameter(event.target.checked);
            const newState = event.target.checked;
            setTimeout(() => {
              setIsChecked(newState);
            }, 50);
          }}
          label={intl.formatMessage({
            id: "The https connection to the 'Utdon' server uses a self-signed certificate",
          })}
          checked={isChecked}
        />
      ) : (
        <div></div>
      )}
    </FieldSet>
  );
};
