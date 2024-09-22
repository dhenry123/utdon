/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";
import "./Summary.scss";
import { useEffect, useState } from "react";
import ButtonGeneric from "./ButtonGeneric";
import { UptodateForm } from "../../../src/Global.types";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { useAppDispatch } from "../app/hook";
import { Block } from "./Block";
import { FieldSet } from "./FieldSet";
import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import { INITIALIZED_TOAST } from "../../../src/Constants";

export interface SummaryProps {
  uptodateForm: UptodateForm;
  isChangesOnModel: boolean;
  onSave: () => Promise<unknown>;
  isRecordable: boolean;
  handleOnCompare: () => void;
}

export const Summary = ({
  uptodateForm,
  isChangesOnModel,
  onSave,
  handleOnCompare,
  isRecordable,
}: SummaryProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

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
        <Block className="identity">
          <h3>{intl.formatMessage({ id: "Identity" })}</h3>
          <FieldSet legend={intl.formatMessage({ id: "Name" })}>
            <div className="label">{uptodateForm.name}</div>
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({ id: "Authorized for group(s)" })}
          >
            <div className="label">
              {uptodateForm &&
                uptodateForm.groups &&
                uptodateForm.groups.join(",")}
            </div>
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
        </Block>
        <Block className="production">
          <h3>{intl.formatMessage({ id: "Production informations" })}</h3>
          <FieldSetClickableUrl
            legend={intl.formatMessage({ id: "Production version url" })}
            url={uptodateForm.urlProduction}
            className="label"
          />
          <FieldSet legend={intl.formatMessage({ id: "Type of content" })}>
            <div className="label">{uptodateForm.scrapTypeProduction}</div>
          </FieldSet>
          <FieldSet legend={intl.formatMessage({ id: "Expression" })}>
            <div className="label">{uptodateForm.exprProduction}</div>
          </FieldSet>
        </Block>
        <Block className="git">
          <h3>{intl.formatMessage({ id: "Git repository informations" })}</h3>
          <FieldSetClickableUrl
            legend={intl.formatMessage({ id: "Git repository url" })}
            url={uptodateForm.urlGitHub}
            className="label"
          />
          <FieldSet legend={intl.formatMessage({ id: "Expression" })}>
            <div className="label">{uptodateForm.exprGithub}</div>
          </FieldSet>
        </Block>
        <Block className="actions">
          <h3>{intl.formatMessage({ id: "Actions informations" })}</h3>
          <FieldSet
            legend={intl.formatMessage({
              id: "Url of the notification service",
            })}
          >
            <div className="label">{uptodateForm.urlCronJobMonitoring}</div>
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({
              id: "HEADER pour Authentification API",
            })}
          >
            <div className="label">{uptodateForm.urlCronJobMonitoringAuth}</div>
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({
              id: "Url of the CI/CD API entrypoint",
            })}
          >
            <div className="label">{uptodateForm.urlCICD}</div>
          </FieldSet>
          <FieldSet
            legend={intl.formatMessage({
              id: "HEADER pour Authentification API",
            })}
          >
            <div className="label">{uptodateForm.urlCICDAuth}</div>
          </FieldSet>
        </Block>
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
    </div>
  );
};
