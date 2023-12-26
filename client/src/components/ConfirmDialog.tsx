/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./ConfirmDialog.scss";
import { Dialog } from "./Dialog";
import ButtonGeneric from "./ButtonGeneric";

interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  visible,
  message,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const intl = useIntl();

  return (
    <Dialog
      visible={visible}
      onHide={() => {}}
      header={intl.formatMessage({ id: "Confirmation" })}
    >
      <div className={`ConfirmDialog`}>
        <div className="message">{message}</div>
        <div className="groupButtons">
          <ButtonGeneric
            label={intl.formatMessage({ id: "Yes" })}
            onClick={onConfirm}
          />
          <ButtonGeneric
            className="success"
            label={intl.formatMessage({ id: "No" })}
            onClick={onCancel}
            autoFocus
          />
        </div>
      </div>
    </Dialog>
  );
};
