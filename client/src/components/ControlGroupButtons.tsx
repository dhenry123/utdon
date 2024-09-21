/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import "./ControlGroupButtons.scss";
import ButtonGeneric from "./ButtonGeneric";
import { CheckBox } from "./CheckBox";
import { UptodateForm } from "../../../src/Global.types";
import { ChangeEvent } from "react";

interface ControlGroupButtonsProps {
  data: UptodateForm;
  handleOnEdit: (value: string) => void;
  setConfirmDeleteIsVisible: (value: boolean) => void;
  handleOnCurlCommands: (value: string) => void;
  handleOnCompare: (control: UptodateForm) => void;
  handleOnPause: (control: ChangeEvent<HTMLInputElement>, uuid: string) => void;
  handleOnDuplicate: (control: UptodateForm) => void;
}

export const ControlGroupButtons = ({
  data,
  handleOnEdit,
  setConfirmDeleteIsVisible,
  handleOnCurlCommands,
  handleOnCompare,
  handleOnPause,
  handleOnDuplicate,
}: ControlGroupButtonsProps) => {
  const intl = useIntl();

  return (
    <div className={`ControlGroupButtons`}>
      <div className="groupButtons">
        <ButtonGeneric
          title={intl.formatMessage({ id: "Edit" })}
          onClick={() => handleOnEdit(data.uuid)}
          icon="pencil"
        />
        <ButtonGeneric
          title={intl.formatMessage({ id: "Duplicate" })}
          onClick={() => handleOnDuplicate(data)}
          icon="copy"
        />
        <ButtonGeneric
          className="warning"
          title={intl.formatMessage({ id: "Delete" })}
          onClick={() => setConfirmDeleteIsVisible(true)}
          icon="trash"
        />
        <ButtonGeneric
          title={intl.formatMessage({ id: "Curl commands for this control" })}
          onClick={() => handleOnCurlCommands(data.uuid)}
          icon="slashes"
        />
        <ButtonGeneric
          className="success"
          title={intl.formatMessage({ id: "Start comparison" })}
          onClick={() => handleOnCompare(data)}
          icon="git-compare"
        />
      </div>
      <CheckBox
        label={intl.formatMessage({ id: "Disable actions" })}
        onChange={(event) => {
          handleOnPause(event, data.uuid);
        }}
        title={intl.formatMessage({
          id: "In the case of a global selection, only the comparison will be processed",
        })}
        checked={data.isPause}
      />
    </div>
  );
};
