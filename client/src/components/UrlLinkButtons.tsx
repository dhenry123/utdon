/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./UrlLinkButtons.scss";
import ButtonGeneric from "./ButtonGeneric";
import { convertUrlToTabName, copyToClipboard } from "../helpers/UiMiscHelper";
import { useRef } from "react";
import { useAppDispatch } from "../app/hook";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { INITIALIZED_TOAST } from "../../../src/Constants";

interface UrlLinkButtonsProps {
  url: string;
}
export const UrlLinkButtons = ({ url }: UrlLinkButtonsProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const divRef = useRef(null);

  const openUrl = () => {
    window.open(url, convertUrlToTabName(url), "noopener,noreferrer");
  };
  const handleOnCopyToClipboard = async () => {
    copyToClipboard(divRef)
      .then(() => {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "info",
            detail: intl.formatMessage({
              id: "The url has been copied to Clipboard",
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
    <div className={`UrlLinkButtons`}>
      <ButtonGeneric
        icon="link"
        title={`${intl.formatMessage({ id: "Open link in new tab" })}: ${url}`}
        onClick={openUrl}
      />
      <ButtonGeneric
        icon="copy"
        title={`${intl.formatMessage({ id: "Copy link" })}: ${url}`}
        onClick={handleOnCopyToClipboard}
      />
      <div className="urlhidden" ref={divRef}>
        {url}
      </div>
    </div>
  );
};
