/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 */

import { useIntl } from "react-intl";

import "./ResultCompare.scss";
import { Badge } from "./Badge";
import {
  ActionCiCdType,
  ActionStatusType,
  ErrorServer,
  UptodateForm,
} from "../../../src/Global.types";
import ButtonGeneric from "./ButtonGeneric";
import { useAppDispatch } from "../app/hook";
import { mytinydcUPDONApi } from "../api/mytinydcUPDONApi";
import { showServiceMessage } from "../app/serviceMessageSlice";
import { FieldSet } from "./FieldSet";
import { FieldSetClickableUrl } from "./FieldSetClickableUrl";
import { useNavigate } from "react-router-dom";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ConfirmDialog } from "./ConfirmDialog";
import { useState } from "react";
import {
  INITIALIZED_TOAST,
  TOAST_DEFAULT_LIFETIME,
} from "../../../src/Constants";
import { getRelativeTime } from "../helpers/DateHelper";

interface ResultCompareProps {
  control: UptodateForm;
}

export const ResultCompare = ({ control }: ResultCompareProps) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false);

  const dispatchServerError = (error: FetchBaseQueryError) => {
    if (error) {
      const servererror = error.data
        ? (JSON.parse(error.data as string) as ErrorServer)
        : { error: "Unknown error" };
      dispatch(
        showServiceMessage({
          ...INITIALIZED_TOAST,
          severity: "error",
          sticky: true,
          detail: `ResultCompare: ${servererror.error}}`,
        })
      );
      if (error.status === 401) return navigate("/login");
    }
  };

  const handleStartCiCd = async (uuid: string) => {
    await dispatch(
      mytinydcUPDONApi.endpoints.callCiCd.initiate({
        uuid: uuid,
      } as ActionCiCdType)
    )
      .unwrap()
      .then((response) => {
        const summary = intl.formatMessage({ id: "The action was triggered" });
        let message = "";
        let severity = "success";
        if (response) {
          message +=
            "Response: " +
            (typeof response === "object"
              ? JSON.stringify(response)
              : response);
        } else {
          message += uuid;
        }
        if (response.error) {
          message = response.error.data;
          severity = "error";
        }
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: severity,
            life: TOAST_DEFAULT_LIFETIME,
            summary: summary,
            detail: message,
          })
        );
      })
      .catch((error: FetchBaseQueryError) => {
        dispatchServerError(error);
      });
  };

  const handleSendStateExternalMonitoring = async (
    uuid: string,
    state: boolean,
    productionVersion: string,
    githubLatestRelease: string
  ) => {
    await dispatch(
      mytinydcUPDONApi.endpoints.sendStateExternalMonitoring.initiate({
        uuid,
        state,
        productionVersion,
        githubLatestRelease,
      } as ActionStatusType)
    )
      .unwrap()
      .then(() => {
        dispatch(
          showServiceMessage({
            ...INITIALIZED_TOAST,
            severity: "success",
            sticky: false,
            detail:
              intl.formatMessage({
                id: "The status has been sent to the monitoring service",
              }) + `: ${uuid}`,
          })
        );
      })
      .catch((error) => {
        dispatchServerError(error);
      });
  };

  return (
    <div className={`ResultCompare`}>
      {control.compareResult ? (
        <>
          <div className="summary">
            <FieldSet legend={intl.formatMessage({ id: "Name" })}>
              <div>{control.name}</div>
            </FieldSet>
            <FieldSetClickableUrl
              legend={intl.formatMessage({ id: "Production version url" })}
              url={control.urlProduction}
            />
            <FieldSetClickableUrl
              legend={intl.formatMessage({ id: "Git repository url" })}
              url={control.urlGitHub}
            ></FieldSetClickableUrl>
            {control.compareResult && control.compareResult.ts ? (
              <FieldSet legend={intl.formatMessage({ id: "Execution date" })}>
                <>{getRelativeTime(control.compareResult.ts, intl)}</>
              </FieldSet>
            ) : (
              <></>
            )}
          </div>
          <div className="result">
            <div>
              <FieldSet legend={intl.formatMessage({ id: "Badge" })}>
                <Badge
                  isSuccess={control.compareResult.state}
                  isWarning={!control.compareResult.strictlyEqual}
                />
              </FieldSet>
              <FieldSet
                legend={intl.formatMessage({
                  id: "Latest available version detected",
                })}
              >
                <div>{control.compareResult.githubLatestRelease}</div>
              </FieldSet>
              <FieldSet
                legend={intl.formatMessage({ id: "Your production version" })}
              >
                <div>{control.compareResult.productionVersion}</div>
              </FieldSet>
            </div>
            <div>
              {control.compareResult.state &&
              !control.compareResult.strictlyEqual ? (
                <FieldSet
                  legend={intl.formatMessage({ id: "Warning" })}
                  className="warning"
                >
                  <div>
                    {intl.formatMessage({
                      id: "This result may be a false positive",
                    })}{" "}
                    :
                    {control.compareResult
                      .githubLatestReleaseIncludesProductionVersion ? (
                      <div className="label">
                        {intl.formatMessage({
                          id: "The latest Github Release tag includes your production version",
                        })}
                      </div>
                    ) : null}
                    {control.compareResult
                      .productionVersionIncludesGithubLatestRelease ? (
                      <div className="label">
                        {intl.formatMessage({
                          id: "Your production version includes the latest git Release tag",
                        })}
                      </div>
                    ) : null}
                  </div>
                </FieldSet>
              ) : null}
            </div>
          </div>
          <FieldSet
            legend={intl.formatMessage({ id: "Operations" })}
            className="operation"
          >
            <div className="groupButtons">
              <ButtonGeneric
                label={intl.formatMessage({
                  id: "Send status to monitoring service",
                })}
                onClick={() => {
                  if (control.uuid && control.compareResult) {
                    handleSendStateExternalMonitoring(
                      control.uuid,
                      control.compareResult.state,
                      control.compareResult.productionVersion,
                      control.compareResult.githubLatestRelease
                    );
                  }
                }}
                disabled={!control.urlCronJobMonitoring || control.isPause}
                title={
                  !control.urlCronJobMonitoring || control.isPause
                    ? intl.formatMessage({
                        id: "Disabled because the monitoring service url is not defined or actions are disabled",
                      })
                    : ""
                }
              />

              <ButtonGeneric
                label={intl.formatMessage({
                  id: "Start the action on the CI/CD chain",
                })}
                onClick={() => {
                  if (control.uuid) {
                    setIsConfirmDialogVisible(true);
                  }
                }}
                title={
                  !control.urlCICD || control.isPause
                    ? intl.formatMessage({
                        id: "Disabled because the CI/CD service url is not defined or actions are disabled",
                      })
                    : ""
                }
                disabled={!control.urlCICD || control.isPause}
              />
            </div>
          </FieldSet>
        </>
      ) : null}
      <ConfirmDialog
        visible={isConfirmDialogVisible}
        message={
          intl.formatMessage({ id: "Are you sure to execute this operation" }) +
          " ?"
        }
        onConfirm={() => {
          setIsConfirmDialogVisible(false);
          handleStartCiCd(control.uuid as string);
        }}
        onCancel={() => setIsConfirmDialogVisible(false)}
      />
    </div>
  );
};
