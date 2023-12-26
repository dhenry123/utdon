/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import "./Dialog.scss";
import ButtonGeneric from "./ButtonGeneric";
import { useIntl } from "react-intl";

interface DialogInterface {
  children?: JSX.Element | string | JSX.Element[];
  onHide: () => void;
  visible: boolean;
  closeButton?: boolean;
  header?: string;
  footerClose?: boolean;
  className?: string;
}

export const Dialog = ({
  children,
  closeButton = false,
  onHide,
  visible,
  header = "",
  footerClose = false,
  className,
}: DialogInterface) => {
  const intl = useIntl();

  if (visible) {
    return (
      <div className="Dialog">
        <div className={"modal-common modal"}></div>
        <div
          onClick={() => onHide()}
          className={`modal-common modal-container ${
            className ? className : ""
          }`}
        >
          <div
            className="modal-content"
            onClick={(event: React.MouseEvent<HTMLElement>) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            <>
              {header ? (
                <div className="modal-header">
                  <h2>{header}</h2>
                  {closeButton ? (
                    <ButtonGeneric
                      onClick={onHide}
                      className="modal-close"
                      icon="ti ti-x"
                    />
                  ) : null}
                </div>
              ) : null}
            </>
            <div className="modal-body">{children}</div>
            {footerClose ? (
              <div className="modal-footer">
                <ButtonGeneric
                  label={intl.formatMessage({ id: "Close" })}
                  onClick={onHide}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } else {
    return null;
  }
};
