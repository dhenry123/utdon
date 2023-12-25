/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import "./Summary.scss";
import { useEffect, useState } from "react";
import ButtonGeneric from "./ButtonGeneric";
import { UptoDateOrNotState, UptodateForm } from "../../../src/Global.types";
import { ResultCompare } from "./ResultCompare";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { useAppDispatch } from "../app/hook";
import { Dialog } from "./Dialog";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";
import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import {
  INITIALIZED_TOAST,
  INPROGRESS_UPTODATEORNOTSTATE,
} from "../../../src/Constants";

export interface SummaryProps {
  uptodateForm: UptodateForm;
  isChangesOnModel: boolean;
  onSave: () => Promise<unknown>;
  isRecordable: boolean;
  onCompare: () => Promise<UptoDateOrNotState>;
}

export const Summary = ({
  uptodateForm,
  isChangesOnModel,
  onSave,
  onCompare,
  isRecordable,
}: SummaryProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const [resultCompare, setResultCompare] = useState<UptoDateOrNotState>();

  const [isCompareButtonDisabled, setIsCompareButtonDisabled] = useState(true);

  const handleOnSave = () => {
    onSave().then(() => {
      dispatch(
        showServiceMessage({
          ...INITIALIZED_TOAST,
          severity: "success",
          detail: intl.formatMessage({ id: "Control has been updated" }),
        })
      );
      setIsCompareButtonDisabled(false);
    });
    //error has been intercepted by parent
  };

  const handleOnCompare = () => {
    setResultCompare(INPROGRESS_UPTODATEORNOTSTATE);
    onCompare().then((result: UptoDateOrNotState) => {
      setIsDialogVisible(true);
      setResultCompare(result);
    });
    //error has been intercepted by parent
  };

  /**
   * to compare, data must be saved
   */
  useEffect(() => {
    setIsCompareButtonDisabled(true);
  }, [uptodateForm]);

  return (
    <div className={`Summary`}>
      <Block className="details">
        <h2>{intl.formatMessage({ id: "Summary" })}</h2>
        <FieldSet legend="name">
          <div className="label">{uptodateForm.name}</div>
        </FieldSet>
        {uptodateForm.uuid ? (
          <>
            <FieldSet legend={intl.formatMessage({ id: "Control Uuid" })}>
              <div className="label">{uptodateForm.uuid}</div>
            </FieldSet>
          </>
        ) : (
          <div></div>
        )}
        <FieldSetClickableUrl
          legend="urlProduction"
          url={uptodateForm.urlProduction}
          className="label"
        />
        <FieldSet legend="scrapTypeProduction">
          <div className="label">{uptodateForm.scrapTypeProduction}</div>
        </FieldSet>
        <FieldSet legend="exprProduction">
          <div className="label">{uptodateForm.exprProduction}</div>
        </FieldSet>
        <FieldSetClickableUrl
          legend="urlProduction"
          url={uptodateForm.urlGitHub}
          className="label"
        />
        <FieldSet legend="exprGithub">
          <div className="label">{uptodateForm.exprGithub}</div>
        </FieldSet>
        <FieldSet legend="urlCronJobMonitoring">
          <div className="label">{uptodateForm.urlCronJobMonitoring}</div>
        </FieldSet>
        <FieldSet legend="urlCronJobMonitoringAuth">
          <div className="label">{uptodateForm.urlCronJobMonitoringAuth}</div>
        </FieldSet>
        <FieldSet legend="urlCICD">
          <div className="label">{uptodateForm.urlCICD}</div>
        </FieldSet>
        <FieldSet legend="urlCICDAuth">
          <div className="label">{uptodateForm.urlCICDAuth}</div>
        </FieldSet>
      </Block>
      <Block className="save">
        <ButtonGeneric
          className={`save ${
            isRecordable && isChangesOnModel ? "mustbesaved" : ""
          }`}
          onClick={handleOnSave}
          icon="device-floppy"
          disabled={!isRecordable}
          label={intl.formatMessage({ id: "Save" })}
          title={
            !isRecordable
              ? intl.formatMessage({
                  id: "You must complete all the steps in this procedure to be able to record data",
                })
              : ""
          }
        />

        <ButtonGeneric
          onClick={handleOnCompare}
          icon="git-compare"
          disabled={isCompareButtonDisabled}
          label={intl.formatMessage({ id: "Compare" })}
          title={
            isCompareButtonDisabled
              ? intl.formatMessage({
                  id: "You must save before starting this operation",
                })
              : ""
          }
        />
      </Block>
      <Dialog
        visible={isDialogVisible}
        onHide={() => setIsDialogVisible(false)}
        header={intl.formatMessage({ id: "Action" })}
        closeButton
      >
        <ResultCompare
          result={resultCompare ? resultCompare : INPROGRESS_UPTODATEORNOTSTATE}
          check={uptodateForm}
        />
      </Dialog>
    </div>
  );
};
